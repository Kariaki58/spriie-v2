"use client"

import * as React from "react"
import { IconShoppingCart, IconPlus, IconMinus, IconTrash, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

interface Product {
  _id: string
  name: string
  price: number
  category: string
  image?: string
}

interface CartModificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
  currentItems: CartItem[]
  onUpdate: (items: CartItem[]) => Promise<void>
}

export function CartModificationDialog({
  open,
  onOpenChange,
  transactionId,
  currentItems,
  onUpdate,
}: CartModificationDialogProps) {
  const [items, setItems] = React.useState<CartItem[]>(currentItems)
  const [products, setProducts] = React.useState<Product[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [categories, setCategories] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false)
  const [showAddProducts, setShowAddProducts] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setItems([...currentItems])
      loadProducts()
    }
  }, [open, currentItems])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      })
      if (searchQuery) params.append("search", searchQuery)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      
      if (data.success) {
        const productsList = data.data || data.products || []
        setProducts(productsList)
        if (data.categories) {
          setCategories(data.categories)
        }
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  React.useEffect(() => {
    if (showAddProducts) {
      loadProducts()
    }
  }, [searchQuery, categoryFilter, showAddProducts])

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index)
      return
    }
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const addProduct = (product: Product) => {
    const existingItem = items.find((item) => item.productId === product._id)
    if (existingItem) {
      // If product already in cart, increase quantity
      setItems((prev) =>
        prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      toast.success(`${product.name} quantity increased`)
    } else {
      // Add new product to cart
      setItems((prev) => [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        },
      ])
      toast.success(`${product.name} added to cart`)
    }
  }

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, categoryFilter])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.075
  const total = subtotal + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error("Cart cannot be empty")
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(items)
      toast.success("Cart updated successfully")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update cart")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShoppingCart className="h-5 w-5" />
            Update Cart Items
          </DialogTitle>
          <DialogDescription>
            Modify the items in this transaction. You can change quantities, remove items, or add new products.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Cart Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Current Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddProducts(!showAddProducts)}
              >
                {showAddProducts ? "Hide Products" : "Add Products"}
              </Button>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Add items to continue</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(item.price)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <IconMinus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-12 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="font-semibold text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(index)}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Products Section */}
          {showAddProducts && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Add Products</h3>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products List */}
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {isLoadingProducts ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Loading products...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const existingItem = items.find((item) => item.productId === product._id)
                      return (
                        <div
                          key={product._id}
                          className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {product.image && (
                              <div className="relative h-12 w-12 rounded-md overflow-hidden border flex-shrink-0">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{product.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrencyCompact(product.price)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {existingItem && (
                              <Badge variant="secondary" className="text-xs">
                                In cart: {existingItem.quantity}
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addProduct(product)}
                            >
                              <IconPlus className="h-3.5 w-3.5 mr-1" />
                              {existingItem ? "Add More" : "Add"}
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2 text-sm bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">VAT (7.5%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || items.length === 0}>
              {isLoading ? "Updating..." : "Update Cart"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
