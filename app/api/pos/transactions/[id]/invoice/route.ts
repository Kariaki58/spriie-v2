import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import POSTransaction from "@/lib/models/pos-transaction"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    // Find transaction (public access for customers, no auth required)
    const transaction = await POSTransaction.findById(id)

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Return transaction data for invoice generation (client-side will generate PDF)
    return NextResponse.json({
      success: true,
      data: {
        transactionNumber: transaction.transactionNumber,
        items: transaction.items,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        paymentStatus: transaction.paymentStatus,
        createdAt: transaction.createdAt,
        paidAt: transaction.paidAt,
      },
    })
  } catch (error: any) {
    console.error("Error fetching transaction for invoice:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
