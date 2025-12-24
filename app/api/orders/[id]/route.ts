import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()

    const { id } = params
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Find order by ID, orderNumber, or trackingId
    const order = await Order.findOne({
      $or: [{ _id: id }, { orderNumber: id }, { trackingId: id }],
    })
      .populate("items.product", "name image description category")
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error: any) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id } = params
    const body = await req.json()

    // Find order
    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Update allowed fields
    const allowedUpdates = [
      "status",
      "paymentStatus",
      "paymentReference",
      "flutterwaveReference",
      "shippingAddress",
    ]

    const updates: any = {}
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Update order
    Object.assign(order, updates)
    await order.save()

    // Populate and return
    const updatedOrder = await Order.findById(order._id)
      .populate("items.product", "name image")
      .lean()

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Order updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
