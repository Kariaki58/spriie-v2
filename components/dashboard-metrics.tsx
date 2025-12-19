"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useMemo } from "react"
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
import { dummyOrders, salesData } from "@/lib/dummy-data"

export function DashboardMetrics() {
  const metrics = useMemo(() => {
    const totalRevenue = dummyOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0)

    const totalOrders = dummyOrders.length
    
    // Calculate total unique customers
    const uniqueCustomers = new Set(dummyOrders.map(order => order.customerEmail))
    const totalCustomers = uniqueCustomers.size

    // Calculate website visitors from sales data
    const recentSales = salesData.slice(-7)
    const previousSales = salesData.slice(-14, -7)
    const totalVisitors = recentSales.reduce((sum, d) => sum + d.views, 0)
    const previousVisitors = previousSales.reduce((sum, d) => sum + d.views, 0)
    const visitorsGrowth =
      previousVisitors > 0
        ? ((totalVisitors - previousVisitors) / previousVisitors) * 100
        : 0

    const salesGrowth =
      previousSales.reduce((sum, d) => sum + d.sales, 0) > 0
        ? ((recentSales.reduce((sum, d) => sum + d.sales, 0) -
            previousSales.reduce((sum, d) => sum + d.sales, 0)) /
            previousSales.reduce((sum, d) => sum + d.sales, 0)) *
          100
        : 0

    const recentOrders = recentSales.reduce((sum, d) => sum + d.orders, 0)
    const previousOrders = previousSales.reduce((sum, d) => sum + d.orders, 0)
    const ordersGrowth =
      previousOrders > 0
        ? ((recentOrders - previousOrders) / previousOrders) * 100
        : 0

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalVisitors,
      salesGrowth,
      ordersGrowth,
      visitorsGrowth,
    }
  }, [])

  const cardData = [
    {
      id: 1,
      title: formatCurrency(metrics.totalRevenue),
      description: "Total Revenue",
      badge: {
        icon: metrics.salesGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
        text: `${metrics.salesGrowth >= 0 ? "+" : ""}${metrics.salesGrowth.toFixed(1)}%`,
        variant: "outline" as const,
      },
      footerTitle: metrics.salesGrowth >= 0 ? "Sales trending up" : "Sales trending down",
      footerDescription: "Compared to last week",
      icon: metrics.salesGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
      trend: metrics.salesGrowth >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      id: 2,
      title: metrics.totalOrders.toString(),
      description: "Total Orders",
      badge: {
        icon: metrics.ordersGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
        text: `${metrics.ordersGrowth >= 0 ? "+" : ""}${metrics.ordersGrowth.toFixed(1)}%`,
        variant: "outline" as const,
      },
      footerTitle: metrics.ordersGrowth >= 0 ? "Orders increasing" : "Orders decreasing",
      footerDescription: "Compared to last week",
      icon: metrics.ordersGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
      trend: metrics.ordersGrowth >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      id: 3,
      title: metrics.totalCustomers.toString(),
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
      title: metrics.totalVisitors.toLocaleString(),
      description: "Website Visitors",
      badge: {
        icon: metrics.visitorsGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
        text: `${metrics.visitorsGrowth >= 0 ? "+" : ""}${metrics.visitorsGrowth.toFixed(1)}%`,
        variant: "outline" as const,
      },
      footerTitle: metrics.visitorsGrowth >= 0 ? "Traffic increasing" : "Traffic decreasing",
      footerDescription: "Last 7 days",
      icon: metrics.visitorsGrowth >= 0 ? IconTrendingUp : IconTrendingDown,
      trend: metrics.visitorsGrowth >= 0 ? ("up" as const) : ("down" as const),
    },
  ]

  return (
    <div className="px-2 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

