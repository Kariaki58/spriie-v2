import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"
import User from "@/lib/models/user"
import { flw } from "@/lib/flutterwave"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, accountNumber, bankCode, accountName } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!accountNumber || !bankCode || !accountName) {
      return NextResponse.json(
        { error: "Account details are required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Get user and wallet
    const user = await User.findById((session as any).userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let wallet = await Wallet.findOne({ user: (session as any).userId })
    if (!wallet) {
      wallet = await Wallet.create({
        user: (session as any).userId,
        available: 0,
        ledger: 0,
        currency: "NGN",
      })
    }

    // Check if user has sufficient balance
    if (wallet.available < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )
    }

    // Verify account with Flutterwave
    try {
      const verifyResponse = await flw.Misc.verify_Account({
        account_number: accountNumber,
        account_bank: bankCode,
      })

      if (verifyResponse.status !== "success") {
        return NextResponse.json(
          { error: "Account verification failed" },
          { status: 400 }
        )
      }

      // Check if account name matches (case-insensitive)
      const verifiedAccountName = verifyResponse.data.account_name.toLowerCase()
      const providedAccountName = accountName.toLowerCase()

      if (verifiedAccountName !== providedAccountName) {
        return NextResponse.json(
          {
            error: "Account name does not match. Please verify your account details.",
            verifiedName: verifyResponse.data.account_name,
          },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error("Account verification error:", error)
      return NextResponse.json(
        { error: "Failed to verify account. Please check your details." },
        { status: 400 }
      )
    }

    // Create withdrawal transaction
    const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Initiate transfer with Flutterwave
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"
      
      const transferResponse = await flw.Transfer.initiate({
        account_bank: bankCode,
        account_number: accountNumber,
        amount: amount,
        narration: `Withdrawal from wallet - ${reference}`,
        currency: "NGN",
        reference: reference,
        callback_url: `${baseUrl}/api/wallet/withdraw/callback`,
        webhook_url: `${baseUrl}/api/wallet/webhook`, // Webhook for transaction updates
        debit_currency: "NGN",
      })

      if (transferResponse.status === "success") {
        // Create pending transaction
        const transaction = await Transaction.create({
          wallet: wallet._id,
          amount: amount,
          type: "debit",
          status: "pending",
          description: "Withdrawal to bank account",
          reference: reference,
          senderOrReceiver: accountName,
          date: new Date(),
        })

        // Deduct from available balance immediately
        wallet.available -= amount
        await wallet.save()

        return NextResponse.json({
          success: true,
          data: {
            transactionId: transaction._id,
            reference: reference,
            transferId: transferResponse.data.id,
            message: "Withdrawal initiated successfully",
          },
        })
      } else {
        return NextResponse.json(
          { error: transferResponse.message || "Failed to initiate withdrawal" },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error("Transfer initiation error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to initiate withdrawal" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Withdraw error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


