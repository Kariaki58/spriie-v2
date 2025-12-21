import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { flw } from "@/lib/flutterwave"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accountNumber, bankCode } = await req.json()

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      )
    }

    // Verify account with Flutterwave
    try {
      const response = await flw.Misc.verify_Account({
        account_number: accountNumber,
        account_bank: bankCode,
      })

      if (response.status === "success") {
        return NextResponse.json({
          success: true,
          data: {
            accountName: response.data.account_name,
            accountNumber: accountNumber,
            bankCode: bankCode,
          },
        })
      } else {
        return NextResponse.json(
          { error: "Account verification failed" },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error("Account verification error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to verify account" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Verify account error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
