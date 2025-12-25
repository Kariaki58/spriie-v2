import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Visitor from "@/lib/models/visitor"
import crypto from "crypto"

/**
 * Generate a hash from IP and User-Agent for privacy-friendly visitor tracking
 */
function hashVisitorId(ip: string, userAgent: string): string {
  const combined = `${ip}-${userAgent}`
  return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 32)
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32)
}

/**
 * POST /api/visitors/track
 * Track a page visit
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const { path, referrer } = body

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 })
    }

    // Get IP address from request headers
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown"
    
    // Get User-Agent
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Create hashed identifiers for privacy
    const visitorId = hashVisitorId(ip, userAgent)
    const ipHash = hashIP(ip)

    // Record the visit
    await Visitor.create({
      visitorId,
      ipHash,
      userAgent,
      path,
      referrer: referrer || null,
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error tracking visitor:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
