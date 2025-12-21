import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"
import { flw } from "@/lib/flutterwave"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Verify the webhook payload
    const { status, data } = payload

    if (status === "successful" && data.status === "SUCCESSFUL") {
      await dbConnect()

      // Find transaction by reference
      const transaction = await Transaction.findOne({
        reference: data.reference,
      })

      if (transaction) {
        // Update transaction status
        transaction.status = "successful"
        await transaction.save()

        // Update wallet ledger (available was already deducted)
        const wallet = await Wallet.findById(transaction.wallet)
        if (wallet) {
          wallet.ledger -= transaction.amount
          await wallet.save()
        }
      }
    } else if (data.status === "FAILED") {
      await dbConnect()

      // Find transaction and refund
      const transaction = await Transaction.findOne({
        reference: data.reference,
      })

      if (transaction) {
        transaction.status = "failed"
        await transaction.save()

        // Refund to wallet
        const wallet = await Wallet.findById(transaction.wallet)
        if (wallet) {
          wallet.available += transaction.amount
          await wallet.save()
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Withdrawal callback error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
