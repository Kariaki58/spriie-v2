import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import dbConnect from "@/lib/db"
import Order from "@/lib/models/order"
import Product from "@/lib/models/product"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `ORD-${timestamp}-${random}`
}

// Generate tracking ID
function generateTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let trackingId = ""
  for (let i = 0; i < 10; i++) {
    trackingId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TRK${trackingId}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    await dbConnect()

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || ""
    const paymentStatus = searchParams.get("paymentStatus") || ""
    const search = searchParams.get("search") || ""

    // Build query
    const query: any = {}

    // If authenticated, filter by user. If not, allow public access (for tracking)
    if (session?.user) {
      query.user = (session.user as any).userId
    }

    if (status) {
      query.status = status
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { trackingId: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.product", "name image")
      .lean()

    // Get total count
    const total = await Order.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const {
      items,
      customerName,
      customerEmail,
      shippingAddress,
      shipping = 0,
      tax = 0,
    } = body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      )
    }

    if (!customerName || !customerEmail || !shippingAddress) {
      return NextResponse.json(
        { error: "Customer name, email, and shipping address are required" },
        { status: 400 }
      )
    }

    // Validate and calculate totals
    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      // Handle variants
      let itemPrice = product.price
      let variantString: string | undefined = undefined

      if (item.variant) {
        // If variant is provided, find matching variant in product
        if (product.variants && product.variants.length > 0) {
          try {
            const variantAttrs = typeof item.variant === "string" 
              ? JSON.parse(item.variant) 
              : item.variant

            // Find matching variant
            const matchingVariant = product.variants.find((v: any) => {
              if (!v.attributes || !Array.isArray(v.attributes)) return false
              
              return variantAttrs.every((attr: any) => 
                v.attributes.some((vAttr: any) => 
                  vAttr.name === attr.name && vAttr.value === attr.value
                )
              )
            })

            if (matchingVariant) {
              itemPrice = matchingVariant.price || product.price
              variantString = JSON.stringify(variantAttrs)
            }
          } catch (e) {
            console.error("Error parsing variant:", e)
          }
        }
      }

      // Check stock
      const stock = variantString && product.variants?.length > 0
        ? product.variants.find((v: any) => {
            const variantAttrs = JSON.parse(variantString)
            return variantAttrs.every((attr: any) => 
              v.attributes?.some((vAttr: any) => 
                vAttr.name === attr.name && vAttr.value === attr.value
              )
            )
          })?.stock ?? product.stock
        : product.stock

      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${stock}, Requested: ${item.quantity}` },
          { status: 400 }
        )
      }

      const itemTotal = itemPrice * item.quantity
      subtotal += itemTotal

      orderItems.push({
        product: product._id,
        productName: product.name,
        variant: variantString,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
      })
    }

    const total = subtotal + shipping + tax

    // Generate order number and tracking ID
    const orderNumber = generateOrderNumber()
    const trackingId = generateTrackingId()

    // Create order
    const order = await Order.create({
      orderNumber,
      trackingId,
      customerName,
      customerEmail,
      shippingAddress,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "flutterwave",
    })

    // Populate product details
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name image")
      .lean()

    return NextResponse.json(
      {
        success: true,
        data: populatedOrder,
        message: "Order created successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating order:", error)
    
    // Handle duplicate tracking ID (rare but possible)
    if (error.code === 11000 && error.keyPattern?.trackingId) {
      return NextResponse.json(
        { error: "Error generating tracking ID. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
