import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"
import { getAppBaseUrl } from "@/lib/app-url"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email, name } = await req.json()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find order
    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 }
      )
    }

    if (order.paymentMethod !== "flutterwave") {
      return NextResponse.json(
        { error: "Only Flutterwave payments can be processed" },
        { status: 400 }
      )
    }

    const baseUrl = getAppBaseUrl()
    const reference = `ORD-${order._id}-${Date.now()}`

    // Initialize Flutterwave payment
    const paymentPayload = {
      tx_ref: reference,
      amount: order.total,
      currency: "NGN",
      redirect_url: `${baseUrl}/api/orders/payment/callback`,
      webhook_url: `${baseUrl}/api/orders/payment/webhook`,
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: email || order.customerEmail,
        name: name || order.customerName,
      },
      customizations: {
        title: "Order Payment",
        description: `Payment for order ${order.orderNumber}`,
      },
      meta: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        trackingId: order.trackingId,
      },
    }

    try {
      const controller = new AbortController()
      const timeoutDuration = 30000 // 30 seconds
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      try {
        const paymentResponse = await fetch(
          "https://api.flutterwave.com/v3/payments",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentPayload),
            signal: controller.signal,
            keepalive: true,
          }
        )

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
            {
              error:
                errorData.message ||
                `Payment gateway error: ${paymentResponse.statusText}`,
            },
            {
              status:
                paymentResponse.status >= 500 ? 502 : paymentResponse.status,
            }
          )
        }

        const paymentData = await paymentResponse.json()

        if (paymentData.status === "success" && paymentData.data?.link) {
          // Update order with payment reference
          order.paymentReference = reference
          await order.save()

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
          console.error(
            "Payment initialization timeout after",
            timeoutDuration,
            "ms"
          )
          return NextResponse.json(
            { error: "Payment gateway timeout. Please try again." },
            { status: 504 }
          )
        }

        if (
          fetchError.code === "UND_ERR_CONNECT_TIMEOUT" ||
          fetchError.code === "ETIMEDOUT" ||
          fetchError.message?.includes("timeout") ||
          fetchError.message?.includes("ECONNRESET") ||
          fetchError.message?.includes("ENOTFOUND")
        ) {
          console.error(
            "Network error connecting to Flutterwave:",
            fetchError.message
          )
          return NextResponse.json(
            {
              error:
                "Unable to connect to payment gateway. Please check your connection and try again.",
            },
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
