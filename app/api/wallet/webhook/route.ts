import { NextRequest, NextResponse } from "next/server"
import { flw } from "@/lib/flutterwave"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"

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

    console.log("Webhook received:", { eventType, transactionId: data?.id, reference: data?.tx_ref })

    await dbConnect()

    // Handle different event types
    if (eventType === "charge.completed" || eventType === "transfer.completed") {
      // Handle successful payment or transfer
      await handleSuccessfulTransaction(data)
    } else if (eventType === "charge.failed" || eventType === "transfer.failed") {
      // Handle failed payment or transfer
      await handleFailedTransaction(data)
    } else if (eventType === "transfer.reversed") {
      // Handle reversed transfer
      await handleReversedTransaction(data)
    }

    // Always return success to acknowledge webhook receipt
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    // Still return success to prevent Flutterwave from retrying immediately
    // Log the error for investigation
    return NextResponse.json({ success: true, error: "Processing error logged" })
  }
}

async function handleSuccessfulTransaction(data: any) {
  try {
    const txRef = data.tx_ref || data.reference
    const amount = parseFloat(data.amount || data.charged_amount || 0)
    const transactionId = data.id?.toString()

    if (!txRef) {
      console.error("No transaction reference found in webhook data")
      return
    }

    // Find transaction by reference
    let transaction = await Transaction.findOne({ reference: txRef })

    if (!transaction) {
      console.log(`Transaction not found for reference: ${txRef}, creating new transaction`)
      // If transaction doesn't exist, verify with Flutterwave first
      try {
        const verifyResponse = await flw.Transaction.verify({
          id: transactionId || txRef,
        })

        if (verifyResponse.status === "success" && verifyResponse.data) {
          const verifiedData = verifyResponse.data
          // Try to find wallet by user email or create a generic transaction
          // This is a fallback for transactions that might not have been created yet
          console.log("Verified transaction but no local record found:", txRef)
          return
        }
      } catch (verifyError) {
        console.error("Failed to verify transaction:", verifyError)
        return
      }
    }

    // Update transaction status if it's pending
    if (transaction.status === "pending") {
      transaction.status = "successful"
      await transaction.save()

      // Update wallet balance
      const wallet = await Wallet.findById(transaction.wallet)
      if (wallet) {
        if (transaction.type === "credit") {
          // Funding: Add to both available and ledger
          wallet.available += transaction.amount
          wallet.ledger += transaction.amount
        } else if (transaction.type === "debit") {
          // Withdrawal: Update ledger (available was already deducted)
          wallet.ledger -= transaction.amount
        }
        await wallet.save()
        console.log(`Wallet ${wallet._id} updated: Available=${wallet.available}, Ledger=${wallet.ledger}`)
      }
    } else {
      console.log(`Transaction ${txRef} already processed with status: ${transaction.status}`)
    }
  } catch (error: any) {
    console.error("Error handling successful transaction:", error)
    throw error
  }
}

async function handleFailedTransaction(data: any) {
  try {
    const txRef = data.tx_ref || data.reference

    if (!txRef) {
      console.error("No transaction reference found in failed webhook data")
      return
    }

    // Find transaction by reference
    const transaction = await Transaction.findOne({ reference: txRef })

    if (transaction && transaction.status === "pending") {
      transaction.status = "failed"
      await transaction.save()

      // If it was a withdrawal, refund the available balance
      if (transaction.type === "debit") {
        const wallet = await Wallet.findById(transaction.wallet)
        if (wallet) {
          wallet.available += transaction.amount
          await wallet.save()
          console.log(`Refunded ${transaction.amount} to wallet ${wallet._id} for failed withdrawal`)
        }
      }
    }
  } catch (error: any) {
    console.error("Error handling failed transaction:", error)
    throw error
  }
}

async function handleReversedTransaction(data: any) {
  try {
    const txRef = data.tx_ref || data.reference

    if (!txRef) {
      console.error("No transaction reference found in reversed webhook data")
      return
    }

    // Find transaction by reference
    const transaction = await Transaction.findOne({ reference: txRef })

    if (transaction) {
      // Mark as failed/reversed
      transaction.status = "failed"
      await transaction.save()

      // Refund the amount
      const wallet = await Wallet.findById(transaction.wallet)
      if (wallet) {
        if (transaction.type === "credit") {
          // Reverse credit: Deduct from wallet
          wallet.available -= transaction.amount
          wallet.ledger -= transaction.amount
        } else if (transaction.type === "debit") {
          // Reverse debit: Add back to wallet
          wallet.available += transaction.amount
          wallet.ledger += transaction.amount
        }
        await wallet.save()
        console.log(`Reversed transaction ${txRef} and updated wallet ${wallet._id}`)
      }
    }
  } catch (error: any) {
    console.error("Error handling reversed transaction:", error)
    throw error
  }
}
