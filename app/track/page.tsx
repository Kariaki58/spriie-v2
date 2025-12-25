"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

interface OrderDetails {
  orderNumber: string
  trackingId: string
  status: string
  paymentStatus: string
  customerName: string
  customerEmail: string
  total: number
  items: Array<{
    productName: string
    quantity: number
    price: number
    variant?: string
  }>
  shippingAddress?: string
  shippingDate?: string
  shippingProvider?: string
  deliveryNote?: string
  createdAt: string
}

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [order, setOrder] = useState<OrderDetails | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingId.trim()) {
      toast.error("Please enter a tracking ID or order number")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/orders/track/${trackingId.trim()}`)
      const data = await res.json()

      if (data.success) {
        setOrder(data.order)
        toast.success("Order found!")
      } else {
        setOrder(null)
        toast.error(data.error || "Order not found")
      }
    } catch (error) {
      console.error("Error tracking order:", error)
      toast.error("Failed to track order. Please try again.")
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "default"
      case "processing":
        return "secondary"
      case "shipped":
        return "default"
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Track Your Order</h1>
              <p className="text-muted-foreground mt-2">
                Enter your tracking ID or order number to check your order status
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
                <CardDescription>
                  You can use either your tracking ID or order number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrack} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingId">Tracking ID / Order Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="trackingId"
                        type="text"
                        placeholder="TRK... or ORD-..."
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            Tracking...
                          </>
                        ) : (
                          "Track"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {order && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order Details</CardTitle>
                      <CardDescription className="mt-1">
                        Order #{order.orderNumber}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Tracking Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tracking ID:</span>
                        <span className="font-mono">{order.trackingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {order.shippingDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping Date:</span>
                          <span>
                            {new Date(order.shippingDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {order.shippingProvider && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping Provider:</span>
                          <span>{order.shippingProvider}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div>
                      <h3 className="font-semibold mb-2">Shipping Address</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item, index) => {
                        let variantDisplay = ""
                        if (item.variant) {
                          try {
                            const variantAttrs = JSON.parse(item.variant)
                            if (Array.isArray(variantAttrs)) {
                              variantDisplay = variantAttrs
                                .map((attr: any) => `${attr.name}: ${attr.value}`)
                                .join(", ")
                            }
                          } catch {
                            variantDisplay = item.variant
                          }
                        }

                        return (
                          <div
                            key={index}
                            className="flex justify-between items-start p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              {variantDisplay && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {variantDisplay}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  {order.deliveryNote && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Delivery Note</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryNote}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
