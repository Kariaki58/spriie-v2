import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Visitor from "@/lib/models/visitor"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "7", 10)
    const now = new Date()

    // Current period
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Previous period for comparison
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - days)

    // Get stats in parallel for better performance
    const [
      uniqueVisitors,
      previousUniqueVisitors,
      activeVisitors,
      visitorsByDate
    ] = await Promise.all([
      // Current period unique visitors
      Visitor.distinct("visitorId", {
        timestamp: { $gte: startDate },
      }),
      
      // Previous period unique visitors
      Visitor.distinct("visitorId", {
        timestamp: { 
          $gte: previousStartDate, 
          $lt: startDate 
        },
      }),
      
      // Active online users (last 5 minutes)
      Visitor.distinct("visitorId", {
        lastActive: { 
          $gte: new Date(now.getTime() - 5 * 60 * 1000) 
        },
      }),
      
      // Visitors by date for chart
      Visitor.aggregate([
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
                timezone: "UTC"
              },
            },
            uniqueVisitors: { $addToSet: "$visitorId" },
            pageViews: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            date: "$_id",
            uniqueVisitors: { $size: "$uniqueVisitors" },
            pageViews: 1,
            sessions: { $size: "$sessions" },
            _id: 0,
          },
        },
        {
          $sort: { date: 1 },
        },
      ])
    ])

    // Calculate growth with better edge case handling
    let growth = 0
    if (previousUniqueVisitors.length > 0) {
      growth = ((uniqueVisitors.length - previousUniqueVisitors.length) / 
               previousUniqueVisitors.length) * 100
    } else if (uniqueVisitors.length > 0) {
      // If no previous data but we have current data, show 100% growth
      growth = 100
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUniqueVisitors: uniqueVisitors.length,
        totalPageViews: visitorsByDate.reduce((sum, day) => sum + day.pageViews, 0),
        growth: Math.round(growth * 10) / 10, // Round to 1 decimal
        visitorsByDate,
        activeOnlineUsers: activeVisitors.length,
        previousPeriodVisitors: previousUniqueVisitors.length,
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