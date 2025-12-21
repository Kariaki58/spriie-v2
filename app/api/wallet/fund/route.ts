import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"
import { flw } from "@/lib/flutterwave"
import { getAppBaseUrl } from "@/lib/app-url"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, email, name } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    await dbConnect()

    // Get or create wallet
    let wallet = await Wallet.findOne({ user: (session as any).userId })
    if (!wallet) {
      wallet = await Wallet.create({
        user: (session as any).userId,
        available: 0,
        ledger: 0,
        currency: "NGN",
      })
    }

    // Initialize Flutterwave payment
    const baseUrl = getAppBaseUrl()
    const reference = `FW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const payload = {
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      redirect_url: `${baseUrl}/api/wallet/fund/callback`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email || session.user.email || "",
        name: name || session.user.name || "User",
      },
      customizations: {
        title: "Fund Wallet",
        description: "Adding funds to wallet",
      },
    }

    // Use Flutterwave Payment Links API via direct HTTP call
    // The SDK doesn't have a PaymentLinks object, so we'll use fetch
    const paymentLinkPayload = {
      tx_ref: reference,
      amount: amount,
      currency: "NGN",
      redirect_url: `${baseUrl}/api/wallet/fund/callback`,
      webhook_url: `${baseUrl}/api/wallet/webhook`, // Webhook for transaction updates
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email || session.user.email || "",
        name: name || session.user.name || "User",
      },
      customizations: {
        title: "Fund Wallet",
        description: "Adding funds to wallet",
      },
    }

    try {
      const paymentLinkResponse = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentLinkPayload),
      })

      const paymentLinkData = await paymentLinkResponse.json()

      if (paymentLinkData.status === "success" && paymentLinkData.data.link) {
        // Create pending transaction
        await Transaction.create({
          wallet: wallet._id,
          amount: amount,
          type: "credit",
          status: "pending",
          description: "Wallet funding",
          reference: reference,
          senderOrReceiver: "Flutterwave",
        })

        return NextResponse.json({
          success: true,
          data: {
            paymentLink: paymentLinkData.data.link,
            reference: reference,
          },
        })
      } else {
        return NextResponse.json(
          { error: paymentLinkData.message || "Failed to initialize payment" },
          { status: 400 }
        )
      }
    } catch (httpError: any) {
      console.error("Payment link creation error:", httpError)
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Fund wallet error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

