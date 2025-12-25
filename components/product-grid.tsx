"use client"

import Image from "next/image"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Product {
  _id: string
  name: string
  description?: string
  price: number
  category: string
  image?: string
  stock?: number
  variants?: Array<{
    attributes?: Array<{ name: string; value: string }>
    stock: number
    price: number
  }>
}

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </CardHeader>
            <CardFooter>
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        // Calculate total stock (product stock + variant stocks)
        const totalStock = product.variants && product.variants.length > 0
          ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : (product.stock || 0)

        const isOutOfStock = totalStock <= 0
        const hasVariants = product.variants && product.variants.length > 0

        return (
          <Card key={product._id} className="overflow-hidden group hover:shadow-lg transition-shadow">
            <Link href={`/products/${product._id}`}>
              <div className="aspect-square relative bg-muted overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>
            </Link>
            
            <CardHeader>
              <Link href={`/products/${product._id}`}>
                <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {product.description}
                </p>
              )}
              {hasVariants && (
                <Badge variant="outline" className="w-fit mt-2">
                  {product.variants!.length} variant{product.variants!.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardHeader>
            
            <CardFooter className="flex items-center justify-between">
              <span className="text-xl font-bold">
                {formatCurrency(product.price)}
              </span>
              <Button asChild disabled={isOutOfStock}>
                <Link href={`/products/${product._id}`}>
                  {isOutOfStock ? "Out of Stock" : "View Details"}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
