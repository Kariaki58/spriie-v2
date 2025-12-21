import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { flw } from "@/lib/flutterwave"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get banks from Flutterwave
    try {
      const response = await flw.Bank.country({ country: "NG" })

      if (response.status === "success") {
        const banks = response.data.map((bank: any) => ({
          code: bank.code,
          name: bank.name,
        }))

        return NextResponse.json({
          success: true,
          data: banks,
        })
      } else {
        return NextResponse.json(
          { error: "Failed to fetch banks" },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error("Get banks error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch banks" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Get banks error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

