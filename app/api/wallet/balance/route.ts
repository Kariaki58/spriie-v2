import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Wallet from "@/lib/models/wallet"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    let wallet = await Wallet.findOne({ user: (session as any).userId })

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        user: (session as any).userId,
        available: 0,
        ledger: 0,
        currency: "NGN",
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        available: wallet.available,
        ledger: wallet.ledger,
        currency: wallet.currency,
      },
    })
  } catch (error: any) {
    console.error("Get balance error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
