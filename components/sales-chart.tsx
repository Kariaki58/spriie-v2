"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { formatCurrencyCompact } from "@/lib/utils"

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(280, 70%, 60%)",
  },
  orders: {
    label: "Orders",
    color: "hsl(200, 70%, 55%)",
  },
} satisfies ChartConfig

interface Transaction {
  _id: string
  total: number
  status?: string
  paymentStatus: string
  createdAt: string
}

export function SalesChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<Array<{ date: string; sales: number; orders: number }>>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchSalesData() {
      try {
        setIsLoading(true)
        
        // Fetch orders and POS transactions
        const [ordersRes, posRes] = await Promise.all([
          fetch("/api/orders?limit=1000"),
          fetch("/api/pos/transactions?limit=1000"),
        ])

        const ordersData = await ordersRes.json()
        const posData = await posRes.json()

        const orders: Transaction[] = ordersData.success ? ordersData.data || [] : []
        const posTransactions: Transaction[] = posData.success ? posData.data || [] : []

        // Combine all transactions
        // Orders have both status and paymentStatus, POS transactions only have paymentStatus
        const allTransactions = [
          ...orders.map((o) => ({ ...o, type: "order" as const })),
          ...posTransactions.map((p) => ({ ...p, type: "pos" as const })),
        ].filter((t) => {
          // Only filter by status if it exists (orders have it, POS transactions don't)
          const isNotCancelled = !("status" in t) || t.status !== "cancelled"
          return isNotCancelled && t.paymentStatus === "paid"
        })

        // Group by date
        const dateMap = new Map<string, { sales: number; orders: number }>()

        allTransactions.forEach((transaction) => {
          const date = new Date(transaction.createdAt)
          const dateKey = date.toISOString().split("T")[0] // YYYY-MM-DD format

          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, { sales: 0, orders: 0 })
          }

          const dayData = dateMap.get(dateKey)!
          dayData.sales += transaction.total || 0
          dayData.orders += 1
        })

        // Convert to array and sort by date
        const data = Array.from(dateMap.entries())
          .map(([date, { sales, orders }]) => ({
            date,
            sales: Math.round(sales),
            orders,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setChartData(data)
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  const filteredData = React.useMemo(() => {
    if (isLoading || chartData.length === 0) return []

    const daysToShow = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow)
    cutoffDate.setHours(0, 0, 0, 0) // Start of day
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0]

    // Filter data within the date range
    const filtered = chartData.filter((item) => item.date >= cutoffDateStr)

    // Fill in missing dates with 0 values for smoother chart display
    const filledData: Array<{ date: string; sales: number; orders: number }> = []
    const dataMap = new Map(filtered.map(item => [item.date, item]))
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(cutoffDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      
      if (dataMap.has(dateStr)) {
        filledData.push(dataMap.get(dateStr)!)
      } else {
        filledData.push({ date: dateStr, sales: 0, orders: 0 })
      }
    }

    return filledData
  }, [chartData, timeRange, isLoading])

  if (isLoading) {
    return (
      <Card className="@container/card hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
          <CardDescription>Loading sales data...</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredData.length === 0) {
    return (
      <Card className="@container/card hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
          <CardDescription>No sales data available</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">No data to display</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle>Sales Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Track your sales performance
          </span>
          <span className="@[540px]/card:hidden">Sales performance</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(280, 70%, 60%)"
                  stopOpacity={0.9}
                />
                <stop
                  offset="50%"
                  stopColor="hsl(280, 70%, 60%)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(320, 70%, 65%)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={timeRange === "7d" ? 24 : timeRange === "30d" ? 48 : 64}
              tickFormatter={(value) => {
                const date = new Date(value)
                // For 7 days, show day name and date. For longer ranges, show month and day
                if (timeRange === "7d") {
                  return date.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                  })
                } else if (timeRange === "30d") {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                } else {
                  // 3 months: show month and day, but more compact
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
