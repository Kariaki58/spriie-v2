import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"
import Wallet from "@/lib/models/wallet"
import { getAppBaseUrl } from "@/lib/app-url"

export async function POST(req: NextRequest) {
  try {
    const { transactionId, email, name } = await req.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    await dbConnect()

    // Find transaction
    const transaction = await POSTransaction.findById(transactionId)
    
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (transaction.paymentStatus === "paid") {
      return NextResponse.json({ error: "Transaction already paid" }, { status: 400 })
    }

    if (transaction.paymentMethod !== "transfer") {
      return NextResponse.json({ error: "Only transfer payments can be processed" }, { status: 400 })
    }

    // Get user's wallet
    let wallet = await Wallet.findOne({ user: transaction.user })
    if (!wallet) {
      // Create wallet if doesn't exist
      wallet = await Wallet.create({
        user: transaction.user,
        available: 0,
        ledger: 0,
        currency: "NGN",
      })
    }

    const baseUrl = getAppBaseUrl()
    const reference = `POS-${transaction._id}-${Date.now()}`

    // Initialize Flutterwave payment
    const paymentPayload = {
      tx_ref: reference,
      amount: transaction.total,
      currency: "NGN",
      redirect_url: `${baseUrl}/api/pos/payment/callback`,
      webhook_url: `${baseUrl}/api/pos/payment/webhook`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email || `customer@example.com`,
        name: name || "POS Customer",
      },
      customizations: {
        title: "POS Payment",
        description: `Payment for transaction ${transaction.transactionNumber}`,
      },
      meta: {
        transactionId: transaction._id.toString(),
        transactionNumber: transaction.transactionNumber,
      },
    }

    try {
      // Use fetch with improved timeout and retry logic
      const controller = new AbortController()
      const timeoutDuration = 30000 // 30 seconds
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      try {
        const paymentResponse = await fetch("https://api.flutterwave.com/v3/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentPayload),
          signal: controller.signal,
          // Add keepalive for better connection handling
          keepalive: true,
        })

        clearTimeout(timeoutId)

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          
          console.error("Flutterwave API error:", errorText)
          return NextResponse.json(
            { error: errorData.message || `Payment gateway error: ${paymentResponse.statusText}` },
            { status: paymentResponse.status >= 500 ? 502 : paymentResponse.status }
          )
        }

        const paymentData = await paymentResponse.json()

        if (paymentData.status === "success" && paymentData.data?.link) {
          // Store payment reference in transaction
          transaction.paymentReference = reference
          await transaction.save()

          return NextResponse.json({
            success: true,
            data: {
              paymentLink: paymentData.data.link,
              reference: reference,
            },
          })
        } else {
          return NextResponse.json(
            { error: paymentData.message || "Failed to initialize payment" },
            { status: 400 }
          )
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        if (fetchError.name === "AbortError") {
          console.error("Payment initialization timeout after", timeoutDuration, "ms")
          return NextResponse.json(
            { error: "Payment gateway timeout. Please try again." },
            { status: 504 }
          )
        }
        
        // Handle network errors
        if (fetchError.code === "UND_ERR_CONNECT_TIMEOUT" || 
            fetchError.code === "ETIMEDOUT" ||
            fetchError.message?.includes("timeout") ||
            fetchError.message?.includes("ECONNRESET") ||
            fetchError.message?.includes("ENOTFOUND")) {
          console.error("Network error connecting to Flutterwave:", fetchError.message)
          return NextResponse.json(
            { error: "Unable to connect to payment gateway. Please check your connection and try again." },
            { status: 504 }
          )
        }
        
        throw fetchError
      }
    } catch (error: any) {
      console.error("Payment initialization error:", error)
      
      return NextResponse.json(
        { error: error.message || "Failed to initialize payment. Please try again." },
        { status: error.status || 500 }
      )
    }
  } catch (error: any) {
    console.error("Initialize payment error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
