import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Visitor from "@/lib/models/visitor"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

function normalizeUserAgent(ua: string): string {
  // Remove version numbers and extra whitespace for consistency
  return ua.replace(/\s+/g, ' ').trim().substring(0, 200)
}

function hashVisitorId(ip: string, userAgent: string): string {
  const normalizedUA = normalizeUserAgent(userAgent)
  const combined = `${ip}-${normalizedUA}`
  return crypto.createHash("sha256").update(combined).digest("hex")
}

function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const { path, referrer } = body

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 })
    }

    // Get IP with better header handling
    const forwarded = req.headers.get("x-forwarded-for")
    const realIp = req.headers.get("x-real-ip")
    const ip = forwarded 
      ? forwarded.split(",")[0].trim() 
      : realIp || "0.0.0.0"

    const userAgent = req.headers.get("user-agent") || "unknown"
    const visitorId = hashVisitorId(ip, userAgent)
    const ipHash = hashIP(ip)
    
    // Generate session ID (lasts 30 minutes of inactivity)
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    
    // Find recent session or create new
    const recentVisit = await Visitor.findOne({
      visitorId,
      lastActive: { $gte: thirtyMinutesAgo }
    }).sort({ lastActive: -1 })

    const sessionId = recentVisit?.sessionId || uuidv4()

    // Record visit with upsert to update lastActive
    await Visitor.findOneAndUpdate(
      {
        visitorId,
        path,
        timestamp: { 
          $gte: new Date(now.getTime() - 2 * 60 * 1000) // Last 2 minutes
        }
      },
      {
        $set: {
          ipHash,
          userAgent: normalizeUserAgent(userAgent),
          referrer: referrer || null,
          lastActive: now,
          sessionId,
        },
        $setOnInsert: {
          timestamp: now,
        }
      },
      {
        upsert: true,
        new: true
      }
    )

    return NextResponse.json({ 
      success: true,
      sessionId 
    })
  } catch (error: any) {
    console.error("Error tracking visitor:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}