import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"
import { updateProductSoldCount } from "@/lib/product-updates"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status")
    const tx_ref = searchParams.get("tx_ref")
    const transaction_id = searchParams.get("transaction_id")

    if (!tx_ref || !status) {
      return NextResponse.redirect(
        new URL("/orders?error=invalid_callback", req.url)
      )
    }

    await dbConnect()

    // Extract order ID from reference (format: ORD-{orderId}-{timestamp})
    const orderIdMatch = tx_ref.match(/ORD-([^-]+)-/)
    if (!orderIdMatch) {
      return NextResponse.redirect(
        new URL("/orders?error=invalid_reference", req.url)
      )
    }

    const orderId = orderIdMatch[1]
    const order = await Order.findById(orderId)

    if (!order) {
      return NextResponse.redirect(
        new URL("/orders?error=order_not_found", req.url)
      )
    }

    // Verify payment with Flutterwave
    if (status === "successful" && transaction_id) {
      try {
        const verifyResponse = await fetch(
          `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            },
          }
        )

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()

          if (
            verifyData.status === "success" &&
            verifyData.data.status === "successful" &&
            verifyData.data.amount === order.total
          ) {
            // Only update if not already paid (to prevent double-counting)
            if (order.paymentStatus !== "paid") {
              // Update order
              order.paymentStatus = "paid"
              order.flutterwaveReference = tx_ref
              order.status = "processing"
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
                // Don't fail the callback if product update fails
              }
            }

            return NextResponse.redirect(
              new URL(
                `/orders/${order.trackingId}?payment=success`,
                req.url
              )
            )
          }
        }
      } catch (error) {
        console.error("Error verifying payment:", error)
      }
    }

    // If payment failed or couldn't verify
    if (status === "cancelled") {
      return NextResponse.redirect(
        new URL(
          `/orders/${order.trackingId}?payment=cancelled`,
          req.url
        )
      )
    }

    return NextResponse.redirect(
      new URL(`/orders/${order.trackingId}?payment=failed`, req.url)
    )
  } catch (error: any) {
    console.error("Callback error:", error)
    return NextResponse.redirect(
      new URL("/orders?error=server_error", req.url)
    )
  }
}
