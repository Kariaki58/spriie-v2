"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  category: string
  image?: string
  images?: string[]
  stock?: number
  variants?: Array<{
    attributes?: Array<{ name: string; value: string }>
    stock: number
    price: number
    sku?: string
  }>
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const productId = params?.id as string

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return

      try {
        setIsLoading(true)
        const res = await fetch(`/api/products/${productId}`)
        const data = await res.json()

        if (data.success && data.product) {
          setProduct(data.product)
        } else {
          toast.error("Product not found")
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to load product")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [productId, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return null
  }

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : (product.stock || 0)

  const isOutOfStock = totalStock <= 0
  const displayImage = product.image || (product.images && product.images[0])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            ← Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <Badge variant="outline" className="mb-4">
                  {product.category}
                </Badge>
                {isOutOfStock && (
                  <Badge variant="destructive" className="ml-2">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-3xl font-bold mb-4">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {product.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Available Variants</h2>
                  <div className="space-y-2">
                    {product.variants.map((variant, index) => {
                      const variantPrice = product.price + (variant.price || 0)
                      const variantStock = variant.stock || 0
                      const variantAttrs = variant.attributes || []
                      
                      return (
                        <Card key={index} className={variantStock <= 0 ? "opacity-50" : ""}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {variantAttrs.length > 0 ? (
                                  <div className="space-y-1">
                                    {variantAttrs.map((attr, attrIndex) => (
                                      <div key={attrIndex} className="text-sm">
                                        <span className="font-medium">{attr.name}:</span>{" "}
                                        <span className="text-muted-foreground">{attr.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Variant {index + 1}</span>
                                )}
                                <p className="text-sm text-muted-foreground mt-2">
                                  Stock: {variantStock} units
                                </p>
                                {variant.sku && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    SKU: {variant.sku}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatCurrency(variantPrice)}
                                </p>
                                {variantStock <= 0 && (
                                  <Badge variant="destructive" className="mt-1">
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  size="lg"
                  disabled={isOutOfStock}
                  onClick={() => toast.info("Add to cart functionality coming soon!")}
                  className="flex-1"
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toast.info("Order functionality coming soon!")}
                >
                  Buy Now
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Stock: {totalStock} units
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
