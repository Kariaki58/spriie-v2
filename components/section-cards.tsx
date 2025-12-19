"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const cardData = [
  {
    id: 1,
    title: "₦1,250.00",
    description: "Total Revenue",
    badge: {
      icon: IconTrendingUp,
      text: "+12.5%",
      variant: "outline" as const,
    },
    footerTitle: "Trending up this month",
    footerDescription: "Visitors for the last 6 months",
    icon: IconTrendingUp,
    trend: "up" as const,
  },
  {
    id: 2,
    title: "1,234",
    description: "New Customers",
    badge: {
      icon: IconTrendingDown,
      text: "-20%",
      variant: "outline" as const,
    },
    footerTitle: "Down 20% this period",
    footerDescription: "Acquisition needs attention",
    icon: IconTrendingDown,
    trend: "down" as const,
  },
  {
    id: 3,
    title: "45,678",
    description: "Active Accounts",
    badge: {
      icon: IconTrendingUp,
      text: "+12.5%",
      variant: "outline" as const,
    },
    footerTitle: "Strong user retention",
    footerDescription: "Engagement exceed targets",
    icon: IconTrendingUp,
    trend: "up" as const,
  },
  {
    id: 4,
    title: "4.5%",
    description: "Growth Rate",
    badge: {
      icon: IconTrendingUp,
      text: "+4.5%",
      variant: "outline" as const,
    },
    footerTitle: "Steady performance increase",
    footerDescription: "Meets growth projections",
    icon: IconTrendingUp,
    trend: "up" as const,
  },
]

export function SectionCards() {
  const [activeIndex, setActiveIndex] = useState(0)

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const goToCard = (index: number) => {
    setActiveIndex(index)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const distance = touchStartX.current - touchEndX.current
    const swipeThreshold = 50

    if (distance > swipeThreshold && activeIndex < cardData.length - 1) {
      setActiveIndex((prev) => prev + 1)
    }

    if (distance < -swipeThreshold && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1)
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="px-2 lg:px-6">
      <div className="@xl/main:hidden">
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-300 ease-out touch-pan-y"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {cardData.map((card) => {
              const BadgeIcon = card.badge.icon
              const FooterIcon = card.icon
              const isTrendingUp = card.trend === "up"

              return (
                <div
                  key={card.id}
                  className="min-w-full px-2 py-3"
                >
                  <Card className="h-full @container/card">
                    <CardHeader>
                      <CardDescription className="text-sm font-medium text-muted-foreground">
                        {card.description}
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">
                        {card.title}
                      </CardTitle>
                      <CardAction>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "gap-1 font-medium",
                            isTrendingUp 
                              ? "text-emerald-700 dark:text-emerald-300" 
                              : "text-rose-700 dark:text-rose-300"
                          )}
                        >
                          <BadgeIcon className="size-3.5" />
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="mt-1 flex justify-center gap-2">
          {cardData.map((_, index) => (
            <button
              key={index}
              className={cn(
                "rounded-full transition-all duration-300",
                activeIndex === index
                  ? "h-2 w-8 bg-foreground"
                  : "h-2 w-2 bg-muted"
              )}
              onClick={() => goToCard(index)}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 @xl/main:grid @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {cardData.map((card) => {
          const BadgeIcon = card.badge.icon
          const FooterIcon = card.icon
          const isTrendingUp = card.trend === "up"

          return (
            <Card key={card.id} className="@container/card">
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
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300"
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
