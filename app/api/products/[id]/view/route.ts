import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import ProductView from "@/lib/models/product-view"
import Product from "@/lib/models/product"
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
 * POST /api/products/[id]/view
 * Track a product view
 * 
 * Behavior:
 * - Views counter is CUMULATIVE (all-time total, never resets)
 * - Each unique visitor can only add 1 view per 24-hour period
 * - Same visitor viewing after 24 hours adds a new view to the total
 * - The counter only increments, never decrements or resets
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get IP address from request headers
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "unknown"
    
    // Get User-Agent
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Create hashed identifiers for privacy
    const visitorId = hashVisitorId(ip, userAgent)
    const ipHash = hashIP(ip)

    // Check if product exists
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if this visitor has viewed this product in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentView = await ProductView.findOne({
      productId: id,
      visitorId,
      timestamp: { $gte: twentyFourHoursAgo },
    })

    // If user has viewed this product in the last 24 hours, don't count as a new view
    if (recentView) {
      return NextResponse.json({ 
        success: true, 
        isNewView: false,
        message: "View already counted within 24 hours" 
      })
    }

    // Record the product view (new view after 24 hours)
    await ProductView.create({
      productId: id,
      visitorId,
      ipHash,
      userAgent,
      timestamp: new Date(),
    })

    // Increment product views count only for new views (after 24 hours)
    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } })

    return NextResponse.json({ 
      success: true, 
      isNewView: true,
      message: "New view recorded" 
    })
  } catch (error: any) {
    console.error("Error tracking product view:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
