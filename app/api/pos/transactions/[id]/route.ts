import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"
import { updateProductSoldCount } from "@/lib/product-updates"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    // Allow public access for customers to view transaction via QR code
    // The transaction ID serves as the access token
    const transaction = await POSTransaction.findOne({
      _id: id,
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
    const body = await req.json()
    const { items, subtotal, tax, total, cardDetails, paymentStatus, qrCode } = body

    await dbConnect()
    const { id } = await params

    // Find transaction
    let transaction
    if (session?.user) {
      // Authenticated requests: find by ID and user
      transaction = await POSTransaction.findOne({
      _id: id,
      user: (session as any).userId,
    })
    } else {
      // Unauthenticated requests: find by ID only (for customer payment completion)
      transaction = await POSTransaction.findOne({
        _id: id,
      })
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // If unauthenticated, only allow payment status updates
    if (!session?.user) {
      if (items || subtotal !== undefined || tax !== undefined || total !== undefined || qrCode || cardDetails) {
        return NextResponse.json(
          { error: "Unauthorized. Only payment status can be updated without authentication." },
          { status: 401 }
        )
      }

      // Allow payment status update for customers
      if (paymentStatus) {
        // Only allow updating to "paid" status
        if (paymentStatus !== "paid") {
          return NextResponse.json(
            { error: "Only payment completion is allowed" },
            { status: 400 }
          )
        }

        // Only allow if transaction is currently pending
        if (transaction.paymentStatus !== "pending") {
          return NextResponse.json(
            { error: "Transaction is not pending payment" },
            { status: 400 }
          )
        }

        // Only update if not already paid (to prevent double-counting)
        if (transaction.paymentStatus !== "paid") {
          transaction.paymentStatus = "paid"
          transaction.paidAt = new Date()
          await transaction.save()

          // Update product sold counts and stock
          try {
            const itemsToUpdate = transaction.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              variant: item.variant,
              price: item.price,
            }))
            await updateProductSoldCount(itemsToUpdate)
          } catch (error) {
            console.error("Error updating product sold counts:", error)
            // Don't fail the update if product update fails
          }
        }

        return NextResponse.json({ success: true, data: transaction })
      }

      return NextResponse.json(
        { error: "No valid update provided" },
        { status: 400 }
      )
    }

    // Authenticated requests: full update access
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
      const wasPending = transaction.paymentStatus === "pending"
      transaction.paymentStatus = paymentStatus
      if (paymentStatus === "paid") {
        transaction.paidAt = new Date()
      }
      
      await transaction.save()

      // If status changed from pending to paid, update product stock
      if (wasPending && paymentStatus === "paid") {
        try {
          const itemsToUpdate = transaction.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            variant: item.variant,
            price: item.price,
          }))
          await updateProductSoldCount(itemsToUpdate)
        } catch (error) {
          console.error("Error updating product sold counts:", error)
          // Don't fail the update if product update fails
        }
      }
    } else {
      await transaction.save()
    }

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

