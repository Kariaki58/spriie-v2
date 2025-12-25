import { NextRequest, NextResponse } from "next/server"
import { flw } from "@/lib/flutterwave"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"
import { updateProductSoldCount } from "@/lib/product-updates"

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature for security
    const signature = req.headers.get("verif-hash")
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH

    if (secretHash && signature !== secretHash) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = await req.json()
    const eventType = payload.event
    const data = payload.data

    console.log("POS Payment webhook received:", { eventType, transactionId: data?.id, reference: data?.tx_ref })

    await dbConnect()

    // Handle successful payment
    if (eventType === "charge.completed") {
      await handleSuccessfulPOSPayment(data)
    } else if (eventType === "charge.failed") {
      await handleFailedPOSPayment(data)
    }

    // Always return success to acknowledge webhook receipt
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("POS Payment webhook error:", error)
    return NextResponse.json({ success: true, error: "Processing error logged" })
  }
}

async function handleSuccessfulPOSPayment(data: any) {
  try {
    const txRef = data.tx_ref
    const amount = parseFloat(data.amount || data.charged_amount || 0)
    const transactionId = data.id?.toString()

    if (!txRef) {
      console.error("No transaction reference found in webhook data")
      return
    }

    // Extract transaction ID from reference (format: POS-{transactionId}-{timestamp})
    const match = txRef.match(/^POS-(.+?)-(\d+)$/)
    if (!match) {
      console.error("Invalid transaction reference format:", txRef)
      return
    }

    const posTransactionId = match[1]

    // Find POS transaction
    const posTransaction = await POSTransaction.findById(posTransactionId)

    if (!posTransaction) {
      console.error(`POS transaction not found: ${posTransactionId}`)
      return
    }

    // Verify payment with Flutterwave
    try {
      const verifyResponse = await flw.Transaction.verify({
        id: transactionId || txRef,
      })

      if (verifyResponse.status !== "success" || verifyResponse.data.status !== "successful") {
        console.error("Payment verification failed:", verifyResponse)
        return
      }
    } catch (verifyError) {
      console.error("Failed to verify transaction:", verifyError)
      return
    }

    // Only process if transaction is still pending
    if (posTransaction.paymentStatus === "pending") {
      // Update POS transaction status
      posTransaction.paymentStatus = "paid"
      posTransaction.paidAt = new Date()
      await posTransaction.save()

      // Get or create wallet for the transaction owner
      let wallet = await Wallet.findOne({ user: posTransaction.user })
      if (!wallet) {
        wallet = await Wallet.create({
          user: posTransaction.user,
          available: 0,
          ledger: 0,
          currency: "NGN",
        })
      }

      // Create wallet transaction record
      await Transaction.create({
        wallet: wallet._id,
        amount: amount,
        type: "credit",
        status: "successful",
        description: `POS Payment - Transaction ${posTransaction.transactionNumber}`,
        reference: txRef,
        senderOrReceiver: "POS Customer",
      })

      // Update wallet balance
      wallet.available += amount
      wallet.ledger += amount
      await wallet.save()

      // Update product sold counts and stock
      try {
        const itemsToUpdate = posTransaction.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant,
          price: item.price,
        }))
        await updateProductSoldCount(itemsToUpdate)
      } catch (error) {
        console.error("Error updating product sold counts:", error)
        // Don't fail the webhook if product update fails
      }

      console.log(`POS Payment successful: Transaction ${posTransaction.transactionNumber}, Amount: ${amount}, Wallet updated`)
    } else {
      console.log(`POS transaction ${posTransaction.transactionNumber} already processed`)
    }
  } catch (error: any) {
    console.error("Error handling successful POS payment:", error)
    throw error
  }
}

async function handleFailedPOSPayment(data: any) {
  try {
    const txRef = data.tx_ref

    if (!txRef) {
      console.error("No transaction reference found in failed webhook data")
      return
    }

    // Extract transaction ID from reference
    const match = txRef.match(/^POS-(.+?)-(\d+)$/)
    if (!match) {
      console.error("Invalid transaction reference format:", txRef)
      return
    }

    const posTransactionId = match[1]

    // Find POS transaction
    const posTransaction = await POSTransaction.findById(posTransactionId)

    if (posTransaction && posTransaction.paymentStatus === "pending") {
      // Optionally mark as failed or leave as pending for retry
      console.log(`POS Payment failed for transaction ${posTransaction.transactionNumber}`)
      // You can choose to update status to "failed" or leave as "pending"
    }
  } catch (error: any) {
    console.error("Error handling failed POS payment:", error)
    throw error
  }
}
