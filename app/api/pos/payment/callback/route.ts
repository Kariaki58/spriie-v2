import { NextRequest, NextResponse } from "next/server"
import { flw } from "@/lib/flutterwave"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const transactionId = searchParams.get("transaction_id")
    const txRef = searchParams.get("tx_ref")
    const status = searchParams.get("status")

    if (!transactionId || !txRef) {
      return NextResponse.redirect(new URL("/payment/error?message=Invalid payment parameters", req.url))
    }

    await dbConnect()

    // Extract POS transaction ID from reference (format: POS-{transactionId}-{timestamp})
    const match = txRef.match(/^POS-(.+?)-(\d+)$/)
    if (!match) {
      return NextResponse.redirect(new URL("/payment/error?message=Invalid transaction reference", req.url))
    }

    const posTransactionId = match[1]

    // Find POS transaction
    const posTransaction = await POSTransaction.findById(posTransactionId)

    if (!posTransaction) {
      return NextResponse.redirect(new URL("/payment/error?message=Transaction not found", req.url))
    }

    // Verify payment with Flutterwave
    try {
      const verifyResponse = await flw.Transaction.verify({
        id: transactionId,
      })

      if (verifyResponse.status !== "success") {
        console.error("Payment verification failed:", verifyResponse)
        return NextResponse.redirect(
          new URL(`/payment/${posTransactionId}?status=failed&message=Payment verification failed`, req.url)
        )
      }

      const paymentData = verifyResponse.data

      // Check if payment was successful
      if (paymentData.status === "successful" && parseFloat(paymentData.charged_amount || paymentData.amount || "0") >= posTransaction.total) {
        // Only update if transaction is still pending
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
            amount: parseFloat(paymentData.charged_amount || paymentData.amount || "0"),
            type: "credit",
            status: "successful",
            description: `POS Payment - Transaction ${posTransaction.transactionNumber}`,
            reference: txRef,
            senderOrReceiver: "POS Customer",
          })

          // Update wallet balance
          wallet.available += parseFloat(paymentData.charged_amount || paymentData.amount || "0")
          wallet.ledger += parseFloat(paymentData.charged_amount || paymentData.amount || "0")
          await wallet.save()

          console.log(`Payment confirmed: Transaction ${posTransaction.transactionNumber}, Amount: ${paymentData.charged_amount}`)
        }

        // Redirect to invoice page with success status
        return NextResponse.redirect(new URL(`/payment/${posTransactionId}?payment=success`, req.url))
      } else {
        // Payment failed or incomplete
        return NextResponse.redirect(
          new URL(`/payment/${posTransactionId}?payment=failed&message=${paymentData.processor_response || "Payment failed"}`, req.url)
        )
      }
    } catch (verifyError: any) {
      console.error("Error verifying payment:", verifyError)
      return NextResponse.redirect(
        new URL(`/payment/${posTransactionId}?payment=error&message=Payment verification error`, req.url)
      )
    }
  } catch (error: any) {
    console.error("Payment callback error:", error)
    return NextResponse.redirect(new URL("/payment/error?message=Payment processing error", req.url))
  }
}
