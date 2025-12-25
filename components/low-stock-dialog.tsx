"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconLoader, IconAlertTriangle } from "@tabler/icons-react"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"

interface LowStockItem {
  productId: string
  productName: string
  productImage?: string
  hasVariants: boolean
  items: Array<{
    variantId?: string
    variantAttributes?: Array<{ name: string; value: string }>
    stock: number
    price: number
    sku?: string
  }>
}

interface LowStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LowStockDialog({ open, onOpenChange }: LowStockDialogProps) {
  const [lowStockItems, setLowStockItems] = React.useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      async function fetchLowStock() {
        try {
          setIsLoading(true)
          const res = await fetch("/api/products/low-stock")
          const result = await res.json()

          if (result.success) {
            setLowStockItems(result.data || [])
          }
        } catch (error) {
          console.error("Error fetching low stock items:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchLowStock()
    }
  }, [open])

  // Flatten items for table display
  const tableRows = React.useMemo(() => {
    const rows: Array<{
      productId: string
      productName: string
      productImage?: string
      variantLabel: string
      stock: number
      price: number
      sku?: string
    }> = []

    lowStockItems.forEach((item) => {
      item.items.forEach((variant) => {
        let variantLabel = item.productName

        if (item.hasVariants && variant.variantAttributes && variant.variantAttributes.length > 0) {
          const attrs = variant.variantAttributes
            .map((attr) => `${attr.name}: ${attr.value}`)
            .join(", ")
          variantLabel = `${item.productName} (${attrs})`
        }

        rows.push({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          variantLabel,
          stock: variant.stock,
          price: variant.price,
          sku: variant.sku,
        })
      })
    })

    return rows
  }, [lowStockItems])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 text-orange-600" />
            Low Stock Items
          </DialogTitle>
          <DialogDescription>
            Products and variants with stock below 20 units
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading low stock items...</span>
            </div>
          ) : tableRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconAlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No low stock items</p>
              <p className="text-sm text-muted-foreground mt-2">
                All products have sufficient stock
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Product / Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, index) => (
                    <TableRow key={`${row.productId}-${index}`}>
                      <TableCell>
                        {row.productImage ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                            <Image
                              src={row.productImage}
                              alt={row.productName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.variantLabel}</div>
                      </TableCell>
                      <TableCell>
                        {row.sku ? (
                          <span className="text-sm text-muted-foreground">{row.sku}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            row.stock < 10
                              ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                          }
                        >
                          {row.stock} units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!isLoading && tableRows.length > 0 && (
          <div className="text-sm text-muted-foreground mt-4 pt-4 border-t">
            Total: {tableRows.length} {tableRows.length === 1 ? "item" : "items"} with low stock
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
