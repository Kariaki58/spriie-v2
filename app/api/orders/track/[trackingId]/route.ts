import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    await dbConnect()

    const { trackingId } = await params
    if (!trackingId) {
      return NextResponse.json(
        { error: "Tracking ID is required" },
        { status: 400 }
      )
    }

    // Find order by trackingId or orderNumber (public endpoint, no auth required)
    const order = await Order.findOne({
      $or: [{ trackingId }, { orderNumber: trackingId }],
    })
      .populate("items.product", "name image description category")
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: "Order not found with the provided tracking ID or order number" },
        { status: 404 }
      )
    }

    // Return order details for tracking
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        trackingId: order.trackingId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        shippingAddress: order.shippingAddress,
        shippingDate: order.shippingDate,
        shippingProvider: order.shippingProvider,
        deliveryNote: order.deliveryNote,
        customerName: order.customerName,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Error fetching order by tracking ID:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
