import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")
  const tx_ref = searchParams.get("tx_ref")

  if (status === "successful" && tx_ref) {
    // Redirect to wallet page with success message
    return NextResponse.redirect(
      new URL(`/dashboard/wallet?funded=true&ref=${tx_ref}`, req.url)
    )
  } else {
    // Redirect with error
    return NextResponse.redirect(
      new URL(`/dashboard/wallet?funded=false`, req.url)
    )
  }
}

