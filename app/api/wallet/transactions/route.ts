import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"
import Transaction from "@/lib/models/transaction"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const wallet = await Wallet.findOne({ user: (session as any).userId })
    if (!wallet) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(100)

    const formattedTransactions = transactions.map((tx) => ({
      id: tx._id.toString(),
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      date: tx.date || tx.createdAt,
      description: tx.description || "",
      senderOrReceiver: tx.senderOrReceiver || "",
      reference: tx.reference || "",
    }))

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
    })
  } catch (error: any) {
    console.error("Get transactions error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

