import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const status = searchParams.get("status") || ""
    const paymentMethod = searchParams.get("paymentMethod") || ""

    // Build query
    const query: any = {
      user: (session as any).userId,
    }

    // Search filter
    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
      ]
    }

    // Status filter
    if (status) {
      query.paymentStatus = status
    }

    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Get transactions with pagination
    const transactions = await POSTransaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await POSTransaction.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching POS transactions:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, paymentMethod, qrCode, cardDetails } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      )
    }

    if (!paymentMethod || !["cash", "transfer"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Valid payment method is required" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const tax = subtotal * 0.075 // 7.5% VAT
    const total = subtotal + tax

    // Generate transaction number
    const transactionNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`

    // Create transaction
    const transaction = await POSTransaction.create({
      transactionNumber,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
      qrCode: paymentMethod === "transfer" ? qrCode : undefined,
      cardDetails: cardDetails || undefined,
      user: (session as any).userId,
      paidAt: paymentMethod === "cash" ? new Date() : undefined,
    })

    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating POS transaction:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

