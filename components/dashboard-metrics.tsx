"use client"

import { IconTrendingDown, IconTrendingUp, IconLoader2 } from "@tabler/icons-react"
import { useMemo, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { useActiveUsers } from "@/components/active-users"

interface Order {
  _id: string
  total: number
  status: string
  paymentStatus: string
  customerEmail: string
  createdAt: string
}

interface POSTransaction {
  _id: string
  total: number
  paymentStatus: string
  customerEmail?: string
  customerName?: string
  createdAt: string
}

export function DashboardMetrics() {
  const [orders, setOrders] = useState<Order[]>([])
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([])
  const [visitorStats, setVisitorStats] = useState<{
    totalUniqueVisitors: number
    growth: number
    activeOnlineUsers: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { count: realtimeActiveUsers, isConnected: isRealtimeConnected } = useActiveUsers()

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        // Fetch all orders (no pagination limit to get all)
        const ordersRes = await fetch("/api/orders?limit=1000")
        const ordersData = await ordersRes.json()
        if (ordersData.success) {
          setOrders(ordersData.data || [])
        }

        // Fetch all POS transactions
        const posRes = await fetch("/api/pos/transactions?limit=1000")
        const posData = await posRes.json()
        if (posData.success) {
          setPosTransactions(posData.data || [])
        }

        // Fetch visitor stats (last 7 days)
        try {
          const visitorsRes = await fetch("/api/visitors/stats?days=7")
          const visitorsData = await visitorsRes.json()
          if (visitorsData.success) {
            setVisitorStats(visitorsData.data)
          }
        } catch (error) {
          console.error("Error fetching visitor stats:", error)
          // Don't fail if visitor stats fail, just don't show them
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const metrics = useMemo(() => {
    // Combine orders and POS transactions
    // Orders have both status and paymentStatus, POS transactions only have paymentStatus
    const allTransactions = [
      ...orders.map((o) => ({ ...o, type: "order" as const })),
      ...posTransactions.map((p) => ({ ...p, type: "pos" as const })),
    ]

    // Filter out cancelled orders and only include paid transactions
    // Orders have status field, POS transactions don't
    const validTransactions = allTransactions.filter((t) => {
      // Only filter by status if it exists (orders have it, POS transactions don't)
      const isNotCancelled = !("status" in t) || t.status !== "cancelled"
      return isNotCancelled && t.paymentStatus === "paid"
    })

    // Calculate total revenue from paid transactions
    const totalRevenue = validTransactions.reduce((sum, t) => sum + (t.total || 0), 0)

    // Total orders (both e-commerce and POS)
    const totalOrders = orders.length + posTransactions.length

    // Calculate unique customers from both sources
    const customerEmails = new Set<string>()
    orders.forEach((order) => {
      if (order.customerEmail) customerEmails.add(order.customerEmail)
    })
    posTransactions.forEach((pos) => {
      if (pos.customerEmail) customerEmails.add(pos.customerEmail)
    })
    const totalCustomers = customerEmails.size

    // Calculate growth - compare last 7 days with previous 7 days
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentTransactions = validTransactions.filter((t) => {
      const date = new Date(t.createdAt)
      return date >= sevenDaysAgo
    })

    const previousTransactions = validTransactions.filter((t) => {
      const date = new Date(t.createdAt)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    const recentRevenue = recentTransactions.reduce((sum, t) => sum + (t.total || 0), 0)
    const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.total || 0), 0)

    const salesGrowth =
      previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const recentOrderCount = recentTransactions.length
    const previousOrderCount = previousTransactions.length

    const ordersGrowth =
      previousOrderCount > 0
        ? ((recentOrderCount - previousOrderCount) / previousOrderCount) * 100
        : 0

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      salesGrowth,
      ordersGrowth,
    }
  }, [orders, posTransactions])

  const cardData = [
    {
      id: 1,
      title: isLoading ? (
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : formatCurrency(metrics.totalRevenue),
      description: "Total Revenue",
      badge: {
        icon: metrics.salesGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
        text: isLoading
          ? "--"
          : `${metrics.salesGrowth >= 0 ? "+" : ""}${metrics.salesGrowth.toFixed(1)}%`,
        variant: "outline" as const,
      },
      footerTitle:
        isLoading || metrics.salesGrowth === 0
          ? "No change"
          : metrics.salesGrowth >= 0
            ? "Sales trending up"
            : "Sales trending down",
      footerDescription: "Compared to last week",
      icon: metrics.salesGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
      trend: metrics.salesGrowth >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      id: 2,
      title: isLoading ? (
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : metrics.totalOrders.toString(),
      description: "Total Orders",
      badge: {
        icon: metrics.ordersGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
        text: isLoading
          ? "--"
          : `${metrics.ordersGrowth >= 0 ? "+" : ""}${metrics.ordersGrowth.toFixed(1)}%`,
        variant: "outline" as const,
      },
      footerTitle:
        isLoading || metrics.ordersGrowth === 0
          ? "No change"
          : metrics.ordersGrowth >= 0
            ? "Orders increasing"
            : "Orders decreasing",
      footerDescription: "Compared to last week",
      icon: metrics.ordersGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
      trend: metrics.ordersGrowth >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      id: 3,
      title: isLoading ? (
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : metrics.totalCustomers.toString(),
      description: "Total Customers",
      badge: {
        icon: IconTrendingUp,
        text: "Active",
        variant: "outline" as const,
      },
      footerTitle: "Customer base",
      footerDescription: "Unique customers with orders",
      icon: IconTrendingUp,
      trend: "up" as const,
    },
    {
      id: 4,
      title: isLoading
        ? <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : realtimeActiveUsers !== null && isRealtimeConnected
          ? `${realtimeActiveUsers}`
          : visitorStats
            ? (visitorStats.totalUniqueVisitors ?? 0).toLocaleString()
            : "0",
      description: "Website Visitors",
      badge: {
        icon:
          !visitorStats || visitorStats.growth >= 0
            ? IconTrendingUp
            : IconTrendingDown,
        text: isLoading
          ? "--"
          : visitorStats
            ? `${visitorStats.growth >= 0 ? "+" : ""}${visitorStats.growth.toFixed(1)}%`
            : "--",
        variant: "outline" as const,
      },
      footerTitle:
        !visitorStats || visitorStats.growth === 0
          ? "No change"
          : visitorStats.growth >= 0
            ? "Traffic increasing"
            : "Traffic decreasing",
      footerDescription: realtimeActiveUsers !== null && isRealtimeConnected
        ? `${realtimeActiveUsers} active online now • ${visitorStats?.totalUniqueVisitors ?? 0} total (7 days)`
        : visitorStats
          ? `${visitorStats.activeOnlineUsers ?? 0} active online • Last 7 days`
          : "0 active online • Last 7 days",
      icon:
        !visitorStats || visitorStats.growth >= 0
          ? IconTrendingUp
          : IconTrendingDown,
      trend:
        !visitorStats || visitorStats.growth >= 0
          ? ("up" as const)
          : ("down" as const),
    },
  ]

  return (
    <div className="px-2 lg:px-6">
      {/* Mobile: Horizontal carousel */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 sm:hidden">
        {cardData.map((card) => {
          const BadgeIcon = card.badge.icon
          const FooterIcon = card.icon
          const isTrendingUp = card.trend === "up"

          return (
            <Card
              key={card.id}
              className="@container/card transition-all hover:shadow-md border min-w-[280px] flex-shrink-0"
            >
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  {card.description}
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {card.title}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 font-medium",
                      isTrendingUp
                        ? "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    )}
                  >
                    <BadgeIcon className="size-4" />
                    {card.badge.text}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <FooterIcon
                    className={cn(
                      "size-4",
                      isTrendingUp
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  />
                  <span>{card.footerTitle}</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {card.footerDescription}
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden sm:grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {cardData.map((card) => {
          const BadgeIcon = card.badge.icon
          const FooterIcon = card.icon
          const isTrendingUp = card.trend === "up"

          return (
            <Card
              key={card.id}
              className="@container/card transition-all hover:shadow-md border"
            >
              <CardHeader>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  {card.description}
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {card.title}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 font-medium",
                      isTrendingUp
                        ? "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    )}
                  >
                    <BadgeIcon className="size-4" />
                    {card.badge.text}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <FooterIcon
                    className={cn(
                      "size-4",
                      isTrendingUp
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  />
                  <span>{card.footerTitle}</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  {card.footerDescription}
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

