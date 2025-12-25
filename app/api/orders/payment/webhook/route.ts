import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"
import { updateProductSoldCount } from "@/lib/product-updates"

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
        // Only update if not already paid (to prevent double-counting)
        if (order.paymentStatus !== "paid") {
          // Update order payment status
          order.paymentStatus = "paid"
          order.flutterwaveReference = transaction.tx_ref || transaction.flw_ref
          order.status = "processing" // Move to processing after payment
          await order.save()

          // Update product sold counts and stock
          try {
            const itemsToUpdate = order.items.map((item: any) => ({
              productId: item.product,
              quantity: item.quantity,
              variant: item.variant,
              price: item.price,
            }))
            await updateProductSoldCount(itemsToUpdate)
          } catch (error) {
            console.error("Error updating product sold counts:", error)
            // Don't fail the webhook if product update fails
          }

          console.log(`Order ${order.orderNumber} marked as paid`)
        } else {
          console.log(`Order ${order.orderNumber} already marked as paid`)
        }
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
