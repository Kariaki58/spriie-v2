"use client"

import * as React from "react"
import { IconPackage, IconCurrencyNaira, IconAlertTriangle, IconChartBar } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"
import { LowStockDialog } from "@/components/low-stock-dialog"

interface ProductStats {
  totalProducts: number
  totalRevenue: number
  lowStockCount: number
  totalInventoryValue: number
}

export function ProductStatsCards() {
  const [stats, setStats] = React.useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [lowStockDialogOpen, setLowStockDialogOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/products/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const result = await response.json()
        setStats(result.stats)
      } catch (error) {
        console.error('Error fetching product stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-1" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      description: "Products in catalog",
      icon: IconPackage,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Total Revenue",
      value: formatCurrencyCompact(stats.totalRevenue),
      description: "Lifetime revenue",
      icon: IconCurrencyNaira,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Low Stock Alert",
      value: stats.lowStockCount.toLocaleString(),
      description: "Products < 20 units",
      icon: IconAlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.totalInventoryValue),
      description: "Total stock value",
      icon: IconChartBar,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
  ]

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          const isLowStockCard = card.title === "Low Stock Alert"
          
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
                {isLowStockCard && stats.lowStockCount > 0 && (
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2 text-xs text-orange-600 hover:text-orange-700"
                    onClick={() => setLowStockDialogOpen(true)}
                  >
                    View all →
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <LowStockDialog open={lowStockDialogOpen} onOpenChange={setLowStockDialogOpen} />
    </>
  )
}
