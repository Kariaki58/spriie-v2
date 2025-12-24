import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"

export async function POST(req: NextRequest) {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH
    const signature = req.headers.get("verif-hash")

    if (!signature || signature !== secretHash) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payload = await req.json()
    await dbConnect()

    // Handle charge.completed event
    if (payload.event === "charge.completed" && payload.data) {
      const transaction = payload.data
      const orderId = transaction.meta?.orderId

      if (!orderId) {
        console.error("Order ID not found in webhook payload")
        return NextResponse.json({ status: "ok" })
      }

      // Find order
      const order = await Order.findById(orderId)
      if (!order) {
        console.error(`Order ${orderId} not found`)
        return NextResponse.json({ status: "ok" })
      }

      // Verify transaction status
      if (transaction.status === "successful" && transaction.amount === order.total) {
        // Update order payment status
        order.paymentStatus = "paid"
        order.flutterwaveReference = transaction.tx_ref || transaction.flw_ref
        order.status = "processing" // Move to processing after payment
        await order.save()

        console.log(`Order ${order.orderNumber} marked as paid`)
      }
    }

    return NextResponse.json({ status: "ok" })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
