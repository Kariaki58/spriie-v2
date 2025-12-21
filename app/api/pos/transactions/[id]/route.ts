import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const { id } = await params

    const transaction = await POSTransaction.findOne({
      _id: id,
      user: (session as any).userId,
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, subtotal, tax, total, cardDetails, paymentStatus, qrCode } = body

    await dbConnect()
    const { id } = await params

    // Find transaction
    const transaction = await POSTransaction.findOne({
      _id: id,
      user: (session as any).userId,
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check if transaction can be modified (only pending or failed)
    if (
      transaction.paymentStatus !== "pending" &&
      transaction.paymentStatus !== "failed"
    ) {
      return NextResponse.json(
        {
          error:
            "Transaction cannot be modified. Only pending or failed transactions can be updated.",
        },
        { status: 400 }
      )
    }

    // Update items and totals if provided
    if (items) {
      transaction.items = items
      if (subtotal !== undefined) transaction.subtotal = subtotal
      if (tax !== undefined) transaction.tax = tax
      if (total !== undefined) transaction.total = total
    }

    // Update QR code if provided
    if (qrCode) {
      transaction.qrCode = qrCode
    }

    // Update card details if provided
    if (cardDetails) {
      transaction.cardDetails = cardDetails
    }

    // Update payment status if provided
    if (paymentStatus) {
      transaction.paymentStatus = paymentStatus
      if (paymentStatus === "paid") {
        transaction.paidAt = new Date()
      }
    }

    await transaction.save()

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

