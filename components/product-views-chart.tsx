"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
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
import { productViewsData } from "@/lib/dummy-data"

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(200, 70%, 55%)",
  },
  conversions: {
    label: "Conversions",
    color: "hsl(50, 80%, 60%)",
  },
} satisfies ChartConfig

export function ProductViewsChart() {
  return (
    <Card className="@container/card hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle>Product Views & Conversions</CardTitle>
        <CardDescription>
          Track which products are getting the most attention
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <BarChart data={productViewsData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="product"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              angle={-45}
              textAnchor="end"
              height={80}
              tickFormatter={(value) => value.split(" ")[0]}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="views"
              fill="var(--color-views)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="conversions"
              fill="var(--color-conversions)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

