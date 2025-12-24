"use client"

import * as React from "react"
import {
  IconMinus,
  IconPlus,
  IconQrcode,
  IconRefresh,
  IconSearch,
  IconShoppingCart,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconArrowUp,
  IconArrowDown,
  IconCheck,
  IconDownload,
  IconTrendingUp,
  IconReceipt,
  IconClock,
  IconCurrencyNaira,
} from "@tabler/icons-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils"
import { getAppBaseUrl } from "@/lib/app-url"
import { CartModificationDialog } from "./cart-modification-dialog"
import { downloadInvoice } from "@/lib/invoice-generator"

interface Product {
  _id: string
  name: string
  price: number
  category: string
  image?: string
  stock?: number
  variants?: Array<{
    attributes?: Array<{ name: string; value: string }>
    stock: number
    price: number
    sku?: string
  }>
}

interface Transaction {
  _id: string
  transactionNumber: string
  items: Array<{
    productId: string
    productName: string
    price: number
    quantity: number
    variant?: string
  }>
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "transfer"
  paymentStatus: "pending" | "paid" | "cancelled"
  qrCode?: string
  cardDetails?: {
    cardNumber: string
    cardName: string
    expiryDate: string
    cvv: string
  }
  createdAt: string
  paidAt?: string
}

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  variant?: string
}

export function POSInterface() {
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [categories, setCategories] = React.useState<string[]>([])
  
  // Product pagination
  const [productPage, setProductPage] = React.useState(1)
  const [productTotalPages, setProductTotalPages] = React.useState(1)
  const [productSearch, setProductSearch] = React.useState("")
  const [productCategory, setProductCategory] = React.useState("all")
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false)
  
  // Transaction pagination, search, sorting
  const [transactionPage, setTransactionPage] = React.useState(1)
  const [transactionTotalPages, setTransactionTotalPages] = React.useState(1)
  const [transactionSearch, setTransactionSearch] = React.useState("")
  const [transactionSortBy, setTransactionSortBy] = React.useState("createdAt")
  const [transactionSortOrder, setTransactionSortOrder] = React.useState<"asc" | "desc">("desc")
  const [transactionStatus, setTransactionStatus] = React.useState("")
  const [transactionPaymentMethod, setTransactionPaymentMethod] = React.useState("")
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(false)
  
  // UI state
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "transfer">("cash")
  const [showQRCode, setShowQRCode] = React.useState(false)
  const [currentTransaction, setCurrentTransaction] = React.useState<Transaction | null>(null)
  const [showCartDialog, setShowCartDialog] = React.useState(false)
  const [selectedTransactionForCart, setSelectedTransactionForCart] = React.useState<Transaction | null>(null)
  
  // Variant selection state
  const [showVariantDialog, setShowVariantDialog] = React.useState(false)
  const [productForVariant, setProductForVariant] = React.useState<Product | null>(null)
  const [selectedVariantIndices, setSelectedVariantIndices] = React.useState<number[]>([])
  
  // Checkout submission state to prevent duplicates
  const [isSubmittingCheckout, setIsSubmittingCheckout] = React.useState(false)

  // Load products
  const loadProducts = React.useCallback(async () => {
    setIsLoadingProducts(true)
    try {
      const params = new URLSearchParams({
        page: productPage.toString(),
        limit: "20",
      })
      if (productSearch) params.append("search", productSearch)
      if (productCategory !== "all") params.append("category", productCategory)

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      
      if (data.success) {
        // Handle both response formats: data.data (new) or data.products (old)
        const productsList = data.data || data.products || []
        setProducts(productsList)
        setProductTotalPages(data.pagination?.totalPages || 1)
        if (data.categories) {
          setCategories(data.categories)
        }
      } else if (data.products) {
        // Fallback for old API format
        setProducts(data.products)
        setProductTotalPages(1)
      }
    } catch (error) {
      console.error("Error loading products:", error)
      toast.error("Failed to load products")
    } finally {
      setIsLoadingProducts(false)
    }
  }, [productPage, productSearch, productCategory])

  // Load transactions
  const loadTransactions = React.useCallback(async () => {
    setIsLoadingTransactions(true)
    try {
      const params = new URLSearchParams({
        page: transactionPage.toString(),
        limit: "10",
      })
      if (transactionSearch) params.append("search", transactionSearch)
      if (transactionSortBy) params.append("sortBy", transactionSortBy)
      if (transactionSortOrder) params.append("sortOrder", transactionSortOrder)
      if (transactionStatus) params.append("status", transactionStatus)
      if (transactionPaymentMethod) params.append("paymentMethod", transactionPaymentMethod)

      const res = await fetch(`/api/pos/transactions?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setTransactions(data.data)
        setTransactionTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setIsLoadingTransactions(false)
    }
  }, [transactionPage, transactionSearch, transactionSortBy, transactionSortOrder, transactionStatus, transactionPaymentMethod])

  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  React.useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Poll for transaction updates every 3 seconds to detect real-time payments
  React.useEffect(() => {
    // Only poll if there are pending transactions
    const hasPending = transactions.some(t => t.paymentStatus === "pending")
    
    if (!hasPending) {
      return // Don't poll if no pending transactions
    }

    const interval = setInterval(() => {
      if (!isLoadingTransactions) {
        loadTransactions()
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length, isLoadingTransactions]) // Poll when transaction count changes or loading state changes

  const addToCart = (product: Product, variantIndex: number | null = null) => {
    let finalPrice = product.price
    let variantString: string | undefined = undefined
    
    if (product.variants && product.variants.length > 0) {
      if (variantIndex !== null && variantIndex >= 0 && variantIndex < product.variants.length) {
        // Use selected variant
        const variant = product.variants[variantIndex]
        finalPrice = variant.price || product.price
        // Store variant attributes as JSON string for proper storage
        variantString = variant.attributes 
          ? JSON.stringify(variant.attributes.map(attr => ({ name: attr.name, value: attr.value })))
          : undefined
      } else if (product.variants.length === 1) {
        // Auto-select if only one variant
        const variant = product.variants[0]
        finalPrice = variant.price || product.price
        variantString = variant.attributes 
          ? JSON.stringify(variant.attributes.map(attr => ({ name: attr.name, value: attr.value })))
          : undefined
      } else {
        // Multiple variants but none selected - show selection dialog
        setProductForVariant(product)
        setSelectedVariantIndices([])
        setShowVariantDialog(true)
        return
      }
    }
    
    // Find existing item with same productId and variant (or both undefined)
    const existingItem = cart.find((item) => 
      item.productId === product._id && item.variant === variantString
    )
    
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product._id && item.variant === variantString
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.name,
          price: finalPrice,
          quantity: 1,
          variant: variantString,
        },
      ])
    }
    
    const displayName = variantString ? `${product.name} (${variantString})` : product.name
    toast.success(`${displayName} added to cart`)
  }
  
  const handleVariantClick = (index: number) => {
    if (!productForVariant) return
    
    // Add variant directly to cart when clicked
    addToCart(productForVariant, index)
    
    // Track that this variant was added (for UI feedback)
    setSelectedVariantIndices((prev) => {
      if (prev.includes(index)) {
        // If already added, don't add again (already in cart)
        return prev
      } else {
        return [...prev, index]
      }
    })
  }
  
  const handleAddWithoutVariant = () => {
    if (productForVariant) {
      // Add with base price, no variant
      const existingItem = cart.find((item) => 
        item.productId === productForVariant._id && !item.variant
      )
      
      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.productId === productForVariant._id && !item.variant
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        )
      } else {
        setCart([
          ...cart,
          {
            productId: productForVariant._id,
            productName: productForVariant.name,
            price: productForVariant.price,
            quantity: 1,
          },
        ])
      }
      toast.success(`${productForVariant.name} added to cart`)
      setShowVariantDialog(false)
      setProductForVariant(null)
      setSelectedVariantIndices([])
    }
  }

  const removeFromCart = (productId: string, variant?: string) => {
    setCart(cart.filter((item) => 
      !(item.productId === productId && item.variant === variant)
    ))
    toast.success("Item removed from cart")
  }

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variant)
      return
    }
    setCart(
      cart.map((item) =>
        item.productId === productId && item.variant === variant
          ? { ...item, quantity }
          : item
      )
    )
  }

  const getCartQuantity = (productId: string) => {
    // Sum quantities for all variants of this product
    return cart
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.075
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    
    // Prevent duplicate submissions
    if (isSubmittingCheckout) {
      return
    }
    
    setIsSubmittingCheckout(true)

    try {
      const baseUrl = getAppBaseUrl()
      let qrCode: string | undefined

      // Generate QR code for transfer payments
      if (paymentMethod === "transfer") {
        // Create a temporary transaction ID for QR code
        const tempId = `TEMP-${Date.now()}`
        qrCode = `${baseUrl}/payment/${tempId}`
      }

      const res = await fetch("/api/pos/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod,
          qrCode,
        }),
      })

      const data = await res.json()

      if (data.success) {
        let transaction = data.data
        
        // Update QR code with actual transaction ID
        if (paymentMethod === "transfer" && transaction._id) {
          const actualQrCode = `${baseUrl}/payment/${transaction._id}`
          // Update transaction with actual QR code
          const updateRes = await fetch(`/api/pos/transactions/${transaction._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qrCode: actualQrCode }),
          })
          const updateData = await updateRes.json()
          if (updateData.success) {
            transaction = updateData.data
          }
        }

        if (paymentMethod === "transfer") {
          // Transaction is created as pending, QR code is saved
          setCurrentTransaction(transaction)
          setShowQRCode(true)
          toast.success("Transaction created. Please scan QR code to pay.")
          // Clear cart after transaction is created (transaction remains pending)
          setCart([])
        } else {
          toast.success("Transaction completed. Payment received in cash.")
          setCart([])
          setPaymentMethod("cash")
        }
        
        // Reload transactions
        loadTransactions()
      } else {
        toast.error(data.error || "Failed to create transaction")
      }
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error("Failed to process checkout")
    } finally {
      setIsSubmittingCheckout(false)
    }
  }

  const handleMarkAsPaid = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/pos/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Payment marked as paid")
        loadTransactions()
        if (currentTransaction?._id === transactionId) {
          setShowQRCode(false)
          setCurrentTransaction(null)
        }
      } else {
        toast.error(data.error || "Failed to update transaction")
      }
    } catch (error: any) {
      toast.error("Failed to update transaction")
    }
  }

  const handleUpdateCart = async (items: Array<{
    productId: string
    productName: string
    price: number
    quantity: number
  }>) => {
    if (!selectedTransactionForCart) return

    // Recalculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.075
    const total = subtotal + tax

    const res = await fetch(
      `/api/pos/transactions/${selectedTransactionForCart._id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items,
          subtotal,
          tax,
          total,
        }),
      }
    )

    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error || "Failed to update cart")
    }

    loadTransactions()
    if (currentTransaction?._id === selectedTransactionForCart._id) {
      setCurrentTransaction(data.data)
    }
  }

  const handleSort = (field: string) => {
    if (transactionSortBy === field) {
      setTransactionSortOrder(transactionSortOrder === "asc" ? "desc" : "asc")
    } else {
      setTransactionSortBy(field)
      setTransactionSortOrder("desc")
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (transactionSortBy !== field) return null
    return transactionSortOrder === "asc" ? (
      <IconArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <IconArrowDown className="h-3 w-3 ml-1" />
    )
  }

  // Calculate summary metrics
  const today = React.useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return todayStart
  }, [])

  const todayTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      const transactionDate = new Date(t.createdAt)
      return transactionDate >= today
    })
  }, [transactions, today])

  const metrics = React.useMemo(() => {
    const totalRevenueToday = todayTransactions
      .filter((t) => t.paymentStatus === "paid")
      .reduce((sum, t) => sum + t.total, 0)

    const totalTransactionsToday = todayTransactions.length

    const pendingTransactions = transactions.filter((t) => t.paymentStatus === "pending").length

    const paidTransactionsToday = todayTransactions.filter((t) => t.paymentStatus === "paid").length

    return {
      totalRevenueToday,
      totalTransactionsToday,
      pendingTransactions,
      paidTransactionsToday,
    }
  }, [todayTransactions, transactions])

  return (
    <div className="flex flex-col min-h-screen lg:h-screen gap-4 p-2 sm:p-4 pb-4">
      {/* Summary Cards */}
      <div className="w-full">
        {/* Mobile: Horizontal scroll carousel */}
        <div className="flex sm:hidden gap-4 overflow-x-auto pb-2 -mx-2 sm:mx-0 px-2 sm:px-0 scrollbar-hide">
          <Card className="border flex-shrink-0 w-[280px]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Today's Revenue
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconCurrencyNaira className="h-5 w-5 text-primary" />
                {formatCurrency(metrics.totalRevenueToday)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>{metrics.paidTransactionsToday} paid transaction{metrics.paidTransactionsToday !== 1 ? 's' : ''} today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border flex-shrink-0 w-[280px]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Transactions Today
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-primary" />
                {metrics.totalTransactionsToday}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Total transactions created today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border flex-shrink-0 w-[280px]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconClock className="h-5 w-5 text-yellow-600" />
                {metrics.pendingTransactions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Awaiting payment confirmation</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border flex-shrink-0 w-[280px]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Paid Today
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-emerald-600" />
                {metrics.paidTransactionsToday}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Completed payments today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Today's Revenue
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconCurrencyNaira className="h-5 w-5 text-primary" />
                {formatCurrency(metrics.totalRevenueToday)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>{metrics.paidTransactionsToday} paid transaction{metrics.paidTransactionsToday !== 1 ? 's' : ''} today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Transactions Today
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-primary" />
                {metrics.totalTransactionsToday}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Total transactions created today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconClock className="h-5 w-5 text-yellow-600" />
                {metrics.pendingTransactions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Awaiting payment confirmation</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Paid Today
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-emerald-600" />
                {metrics.paidTransactionsToday}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconTrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Completed payments today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="h-96 flex-shrink-0 border rounded-lg bg-card overflow-hidden">
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0 border-b bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Recent Transactions
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={loadTransactions}
                    disabled={isLoadingTransactions}
                  >
                    <IconRefresh
                      className={`h-3.5 w-3.5 ${isLoadingTransactions ? "animate-spin" : ""}`}
                    />
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {transactions.filter((t) => t.paymentStatus === "paid").length} Paid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {/* Transaction Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => {
                    setTransactionSearch(e.target.value)
                    setTransactionPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={transactionStatus || "all"}
                onValueChange={(value) => {
                  setTransactionStatus(value === "all" ? "" : value)
                  setTransactionPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={transactionPaymentMethod || "all"}
                onValueChange={(value) => {
                  setTransactionPaymentMethod(value === "all" ? "" : value)
                  setTransactionPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transactions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm font-medium">No transactions yet</p>
                  <p className="text-xs mt-1">Complete a sale to see transactions here</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-semibold text-sm">
                            {transaction.transactionNumber}
                          </div>
                          {/* Badge on mobile - top right */}
                          <Badge
                            className={`sm:hidden ${
                              transaction.paymentStatus === "paid"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : transaction.paymentStatus === "cancelled"
                                ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                            }`}
                          >
                            {transaction.paymentStatus === "paid"
                              ? "✓ Paid"
                              : transaction.paymentStatus === "cancelled"
                              ? "✗ Cancelled"
                              : "⏳ Pending"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="break-words">
                            {transaction.items.length} item{transaction.items.length !== 1 ? "s" : ""} • {formatCurrency(transaction.total)} • {transaction.paymentMethod === "cash" ? "💵 Cash" : "📱 Transfer"}
                          </div>
                          <div className="text-xs">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {/* Actions section - stacked on mobile, horizontal on desktop */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4 flex-shrink-0">
                        {/* Badge on desktop - hidden on mobile */}
                        <Badge
                          className={`hidden sm:inline-flex ${
                            transaction.paymentStatus === "paid"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : transaction.paymentStatus === "cancelled"
                              ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                              : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                          }`}
                        >
                          {transaction.paymentStatus === "paid"
                            ? "✓ Paid"
                            : transaction.paymentStatus === "cancelled"
                            ? "✗ Cancelled"
                            : "⏳ Pending"}
                        </Badge>
                        
                        {/* Action buttons row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Download Invoice Button - Available for all transactions */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Fetch transaction details if needed
                                const res = await fetch(`/api/pos/transactions/${transaction._id}`)
                                const data = await res.json()
                                
                                if (data.success && data.data) {
                                  const tx = data.data
                                  downloadInvoice({
                                    transactionNumber: tx.transactionNumber,
                                    items: tx.items || [],
                                    subtotal: tx.subtotal,
                                    tax: tx.tax,
                                    total: tx.total,
                                    paymentMethod: tx.paymentMethod,
                                    paymentStatus: tx.paymentStatus,
                                    createdAt: tx.createdAt,
                                    paidAt: tx.paidAt,
                                  }, `invoice-${tx.transactionNumber}.pdf`)
                                  toast.success("Invoice downloaded")
                                } else {
                                  toast.error("Failed to fetch transaction details")
                                }
                              } catch (error) {
                                console.error("Error downloading invoice:", error)
                                toast.error("Failed to download invoice")
                              }
                            }}
                            className="h-8 px-2 sm:px-2"
                            title="Download invoice"
                          >
                            <IconDownload className="h-3.5 w-3.5" />
                          </Button>
                          {transaction.paymentStatus === "pending" && (
                            <>
                              {transaction.qrCode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentTransaction(transaction)
                                    setShowQRCode(true)
                                  }}
                                  className="h-8 px-2"
                                  title="View QR code"
                                >
                                  <IconQrcode className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(transaction.paymentStatus === "pending" || transaction.paymentStatus === "failed") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTransactionForCart(transaction)
                                    setShowCartDialog(true)
                                  }}
                                  className="h-8 px-2"
                                  title="Update cart items"
                                >
                                  <IconShoppingCart className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(transaction._id)}
                                className="h-8 text-xs px-3"
                              >
                                Mark Paid
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transaction Pagination */}
                {transactionTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Page {transactionPage} of {transactionTotalPages}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage(1)}
                        disabled={transactionPage === 1}
                      >
                        <IconChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage((p) => Math.max(1, p - 1))}
                        disabled={transactionPage === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage((p) => Math.min(transactionTotalPages, p + 1))}
                        disabled={transactionPage === transactionTotalPages}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransactionPage(transactionTotalPages)}
                        disabled={transactionPage === transactionTotalPages}
                      >
                        <IconChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Transaction Sorting */}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Sort by:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleSort("createdAt")}
                  >
                    Date <SortIcon field="createdAt" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleSort("total")}
                  >
                    Amount <SortIcon field="total" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleSort("transactionNumber")}
                  >
                    Number <SortIcon field="transactionNumber" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main POS Interface */}
      <div className="flex-1 min-h-[600px] lg:min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Products Section */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden min-h-[500px]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 border-b bg-muted/30 flex-shrink-0">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setProductPage(1)
                }}
                className="pl-9 bg-background"
              />
            </div>
            <Select
              value={productCategory}
              onValueChange={(value) => {
                setProductCategory(value)
                setProductPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
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

          <div className="flex-1 overflow-auto">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-sm font-medium">No products found</p>
                  <p className="text-xs mt-1 text-muted-foreground">Try adjusting your search or filter</p>
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 z-10">
                    <TableRow>
                      <TableHead className="w-12 sm:w-16 hidden sm:table-cell">Image</TableHead>
                      <TableHead className="min-w-[120px]">Product</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center w-20 sm:w-32">In Cart</TableHead>
                      <TableHead className="text-center w-32 sm:w-40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const cartQuantity = getCartQuantity(product._id)
                      return (
                        <TableRow key={product._id} className="hover:bg-muted/30">
                          <TableCell className="hidden sm:table-cell">
                            {product.image && (
                              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-md overflow-hidden border">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2 sm:block">
                              {product.image && (
                                <div className="relative h-8 w-8 sm:hidden rounded-md overflow-hidden border flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div>
                                <div className="text-sm sm:text-base">{product.name}</div>
                                <Badge variant="outline" className="text-xs mt-1 md:hidden">
                                  {product.category}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary whitespace-nowrap">
                            {formatCurrencyCompact(product.price)}
                          </TableCell>
                          <TableCell className="text-center">
                            {cartQuantity > 0 ? (
                              <Badge variant="secondary" className="font-semibold text-xs">
                                {cartQuantity}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              {cartQuantity > 0 ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                    onClick={() => {
                                      const firstCartItem = cart.find(item => item.productId === product._id)
                                      if (firstCartItem) {
                                        updateQuantity(product._id, firstCartItem.quantity - 1, firstCartItem.variant)
                                      }
                                    }}
                                  >
                                    <IconMinus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-semibold">
                                    {cartQuantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                    onClick={() => {
                                      const firstCartItem = cart.find(item => item.productId === product._id)
                                      if (firstCartItem) {
                                        updateQuantity(product._id, firstCartItem.quantity + 1, firstCartItem.variant)
                                      } else {
                                        // If not in cart, try to add (will show variant dialog if needed)
                                        addToCart(product)
                                      }
                                    }}
                                  >
                                    <IconPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      // Remove all variants of this product
                                      setCart(cart.filter(item => item.productId !== product._id))
                                      toast.success("Item removed from cart")
                                    }}
                                  >
                                    <IconTrash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => addToCart(product)}
                                  className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                                >
                                  <IconPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Add</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Product Pagination */}
                {productTotalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Page {productPage} of {productTotalPages}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductPage(1)}
                        disabled={productPage === 1}
                      >
                        <IconChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                        disabled={productPage === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                        disabled={productPage === productTotalPages}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductPage(productTotalPages)}
                        disabled={productPage === productTotalPages}
                      >
                        <IconChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col border rounded-lg bg-card overflow-hidden min-h-[400px] lg:h-auto">
          <Card className="border-0 shadow-none h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0 border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconShoppingCart className="h-5 w-5 text-primary" />
                <span>Cart</span>
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              <CardContent className="p-4">
                {cart.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground py-12">
                    <div className="text-center">
                      <IconShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">Your cart is empty</p>
                      <p className="text-xs mt-1">Add products to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={`${item.productId}-${item.variant || 'base'}`}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="font-medium text-sm truncate">{item.productName}</div>
                            {item.variant && (() => {
                              try {
                                const variantAttrs = JSON.parse(item.variant)
                                if (Array.isArray(variantAttrs) && variantAttrs.length > 0) {
                                  return (
                                    <div className="space-y-0.5 mt-1">
                                      {variantAttrs.map((attr: any, idx: number) => (
                                        <div key={idx} className="text-xs">
                                          <span className="text-muted-foreground">{attr.name}:</span>{" "}
                                          <span className="font-medium text-foreground">{attr.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }
                              } catch (e) {
                                // Fallback for old format (plain string)
                                return (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {item.variant}
                                  </div>
                                )
                              }
                              return null
                            })()}
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatCurrencyCompact(item.price)} × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                            >
                              <IconMinus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-10 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                            >
                              <IconPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromCart(item.productId, item.variant)}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3 text-sm bg-muted/30 rounded-lg p-4">
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

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value: "cash" | "transfer") => setPaymentMethod(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="transfer">📱 Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={isSubmittingCheckout}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {isSubmittingCheckout 
                        ? "Processing..." 
                        : paymentMethod === "cash" 
                          ? "Complete Payment" 
                          : "Generate QR Code"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Scan to Pay</DialogTitle>
            <DialogDescription>
              Customer should scan this QR code with their phone to view invoice and complete payment
            </DialogDescription>
          </DialogHeader>
          {currentTransaction && (
            <div className="flex flex-col flex-1 min-h-0 px-6 pb-6">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                <div className="flex justify-center p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="bg-white p-3 sm:p-4 rounded-lg flex flex-col items-center">
                    {currentTransaction.qrCode && (
                      <>
                        <QRCodeSVG
                          value={currentTransaction.qrCode}
                          size={160}
                          level="H"
                          includeMargin={true}
                        />
                        <div className="text-xs text-center mt-2 text-muted-foreground font-mono">
                          {currentTransaction.transactionNumber}
                        </div>
                        <div className="text-[10px] text-center mt-1 text-muted-foreground break-all max-w-[200px] px-2">
                          {currentTransaction.qrCode}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Card className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Invoice Preview</CardTitle>
                    <CardDescription className="text-xs">
                      What customer will see after scanning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Transaction #</span>
                        <span className="font-mono">{currentTransaction.transactionNumber}</span>
                      </div>
                      <Separator />
                      <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {currentTransaction.items.map((item, idx) => {
                          // Parse variant information if available
                          let variantDisplay: string | null = null
                          if (item.variant) {
                            try {
                              const variantAttrs = JSON.parse(item.variant)
                              if (Array.isArray(variantAttrs) && variantAttrs.length > 0) {
                                variantDisplay = variantAttrs.map((attr: any) => `${attr.name}: ${attr.value}`).join(", ")
                              } else {
                                variantDisplay = item.variant
                              }
                            } catch {
                              variantDisplay = item.variant
                            }
                          }
                          
                          return (
                            <div key={idx} className="flex flex-col gap-0.5 text-xs">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="truncate font-medium">{item.productName}</div>
                                  {variantDisplay && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                      {variantDisplay}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-muted-foreground">
                                    Qty: {item.quantity}
                                  </div>
                                </div>
                                <span className="ml-2 font-semibold whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <Separator />
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(currentTransaction.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT (7.5%)</span>
                          <span>{formatCurrency(currentTransaction.tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span>{formatCurrency(currentTransaction.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentTransaction.paymentStatus === "pending" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedTransactionForCart(currentTransaction)
                      setShowCartDialog(true)
                    }}
                  >
                    <IconShoppingCart className="h-4 w-4 mr-2" />
                    Update Cart Items
                  </Button>
                )}
              </div>

              {/* Sticky footer buttons */}
              <div className="flex gap-2 pt-4 mt-4 border-t flex-shrink-0">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowQRCode(false)
                    setCart([])
                    setPaymentMethod("cash")
                    setCurrentTransaction(null)
                  }}
                >
                  Close
                </Button>
                {currentTransaction.paymentStatus === "pending" && (
                  <Button
                    className="flex-1"
                    onClick={() => handleMarkAsPaid(currentTransaction._id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Modification Dialog */}
      {selectedTransactionForCart && (
        <CartModificationDialog
          open={showCartDialog}
          onOpenChange={setShowCartDialog}
          transactionId={selectedTransactionForCart._id}
          currentItems={selectedTransactionForCart.items}
          onUpdate={handleUpdateCart}
        />
      )}

      {/* Variant Selection Dialog */}
      <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Variants</DialogTitle>
            <DialogDescription>
              {productForVariant?.name} has multiple variants. Click on variants to add them directly to cart. Each variant will be added as a separate item.
            </DialogDescription>
          </DialogHeader>
          {productForVariant && productForVariant.variants && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {productForVariant.variants.map((variant, index) => {
                  const variantPrice = variant.price || productForVariant.price
                  const variantStock = variant.stock ?? 0
                  const isSelected = selectedVariantIndices.includes(index)
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleVariantClick(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {variant.attributes && variant.attributes.length > 0 ? (
                            <div className="space-y-1">
                              {variant.attributes.map((attr, attrIndex) => (
                                <div key={attrIndex} className="text-sm">
                                  <span className="font-medium text-muted-foreground">{attr.name}:</span>{" "}
                                  <span className="font-semibold">{attr.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="font-medium text-sm">
                              Variant {index + 1}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            Stock: {variantStock} • {formatCurrency(variantPrice)}
                          </div>
                        </div>
                        {isSelected && (
                          <IconCheck className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex flex-col gap-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  Click on variants to add them directly to cart. Each variant will be added as a separate item.
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVariantDialog(false)
                    setProductForVariant(null)
                    setSelectedVariantIndices([])
                  }}
                  className="w-full"
                >
                  Done
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddWithoutVariant}
                  className="w-full"
                >
                  Add with Base Price ({formatCurrency(productForVariant.price)})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

