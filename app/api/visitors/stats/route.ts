import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Visitor from "@/lib/models/visitor"

/**
 * GET /api/visitors/stats
 * Get visitor statistics (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "7", 10)

    // Calculate date range
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get total visitors (unique visitorIds)
    const uniqueVisitors = await Visitor.distinct("visitorId", {
      timestamp: { $gte: startDate },
    })

    // Get total page views
    const totalPageViews = await Visitor.countDocuments({
      timestamp: { $gte: startDate },
    })

    // Get visitors by date for chart
    const visitorsByDate = await Visitor.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          uniqueVisitors: { $addToSet: "$visitorId" },
          pageViews: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          uniqueVisitors: { $size: "$uniqueVisitors" },
          pageViews: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ])

    // Calculate growth (compare with previous period)
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    const previousUniqueVisitors = await Visitor.distinct("visitorId", {
      timestamp: { $gte: previousStartDate, $lt: startDate },
    })

    const growth =
      previousUniqueVisitors.length > 0
        ? ((uniqueVisitors.length - previousUniqueVisitors.length) / previousUniqueVisitors.length) * 100
        : 0

    // Calculate active online users (users who visited in the last 15 minutes)
    const activeTimeThreshold = new Date(now.getTime() - 15 * 60 * 1000) // 15 minutes ago
    const activeVisitors = await Visitor.distinct("visitorId", {
      timestamp: { $gte: activeTimeThreshold },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalUniqueVisitors: uniqueVisitors.length,
        totalPageViews,
        growth,
        visitorsByDate,
        activeOnlineUsers: activeVisitors.length,
      },
    })
  } catch (error: any) {
    console.error("Error fetching visitor stats:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
