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
import { posProducts, type POSCartItem, createTransaction, type POSTransaction } from "@/lib/pos-data"
import { storeTransaction, getStoredTransactions, updateTransactionStatus } from "@/lib/transaction-storage"
import { getTestTransactions, TEST_TRANSACTION_IDS } from "@/lib/test-transactions"

export function POSInterface() {
  const [cart, setCart] = React.useState<POSCartItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [paymentMethod, setPaymentMethod] = React.useState<"cash" | "transfer">("cash")
  const [showQRCode, setShowQRCode] = React.useState(false)
  const [currentTransaction, setCurrentTransaction] = React.useState<POSTransaction | null>(null)
  const [transactions, setTransactions] = React.useState<POSTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(false)

  // Load transactions from storage on mount
  const loadTransactions = React.useCallback(() => {
    const stored = getStoredTransactions()
    setTransactions(stored)
  }, [])

  React.useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Listen for storage changes to sync payment status updates
  React.useEffect(() => {
    const handleStorageChange = () => {
      const stored = getStoredTransactions()
      setTransactions(stored)
      // Update current transaction if it exists
      if (currentTransaction) {
        const updated = stored.find((t) => t.id === currentTransaction.id)
        if (updated) {
          setCurrentTransaction(updated)
          // Close QR dialog if payment is completed
          if (updated.paymentStatus === "paid") {
            setShowQRCode(false)
            setCart([])
            setPaymentMethod("cash")
            setCurrentTransaction(null)
            toast.success("Payment completed!")
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    // Also check periodically for updates (in case of same-tab updates)
    const interval = setInterval(() => {
      const stored = getStoredTransactions()
      const hasChanges = JSON.stringify(stored) !== JSON.stringify(transactions)
      if (hasChanges) {
        handleStorageChange()
      }
    }, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [currentTransaction, transactions])

  const filteredProducts = React.useMemo(() => {
    return posProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, categoryFilter])

  const categories = React.useMemo(() => {
    const cats = new Set(posProducts.map((p) => p.category))
    return Array.from(cats)
  }, [])

  const addToCart = (product: typeof posProducts[0]) => {
    const existingItem = cart.find((item) => item.productId === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        },
      ])
    }
    toast.success(`${product.name} added to cart`)
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
    toast.success("Item removed from cart")
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item.productId === productId)?.quantity || 0
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.075 // 7.5% VAT
  const total = subtotal + tax

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (paymentMethod === "transfer") {
      // Use a random test transaction ID for QR code generation
      const randomTestId = TEST_TRANSACTION_IDS[Math.floor(Math.random() * TEST_TRANSACTION_IDS.length)]
      const testTransactions = getTestTransactions()
      const testTransaction = testTransactions.find(t => t.id === randomTestId)
      
      if (testTransaction) {
        // Use the test transaction for QR code
        setCurrentTransaction(testTransaction)
        setShowQRCode(true)
        toast.success("QR code generated. Please scan to pay.")
      } else {
        // Fallback to creating a new transaction if test transaction not found
        const transaction = createTransaction(cart, paymentMethod)
        storeTransaction(transaction)
        setCurrentTransaction(transaction)
        setTransactions([...transactions, transaction])
        setShowQRCode(true)
        toast.success("Transaction created. Please scan QR code to pay.")
      }
    } else {
      // For cash payments, create a normal transaction
      const transaction = createTransaction(cart, paymentMethod)
      storeTransaction(transaction)
      setCurrentTransaction(transaction)
      setTransactions([...transactions, transaction])
      toast.success("Transaction completed. Payment received in cash.")
      setCart([])
      setPaymentMethod("cash")
    }
  }

  const handlePaymentComplete = () => {
    if (currentTransaction) {
      const paidAt = new Date().toISOString()
      updateTransactionStatus(currentTransaction.id, "paid", paidAt)
      setTransactions(
        transactions.map((t) =>
          t.id === currentTransaction.id
            ? { ...t, paymentStatus: "paid" as const, paidAt }
            : t
        )
      )
      setShowQRCode(false)
      setCart([])
      setPaymentMethod("cash")
      setCurrentTransaction(null)
      toast.success("Payment completed successfully!")
    }
  }

  const handleMarkAsPaid = (transactionId: string) => {
    const paidAt = new Date().toISOString()
    updateTransactionStatus(transactionId, "paid", paidAt)
    setTransactions(
      transactions.map((t) =>
        t.id === transactionId
          ? { ...t, paymentStatus: "paid" as const, paidAt }
          : t
      )
    )
    toast.success("Payment marked as paid")
  }

  const handleReloadTransactions = () => {
    setIsLoadingTransactions(true)
    loadTransactions()
    setTimeout(() => {
      setIsLoadingTransactions(false)
      toast.success("Transactions reloaded")
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen gap-4 p-2 sm:p-4 pb-4">
      {/* Transactions Section - Fixed height container */}
      <div className="h-96 flex-shrink-0 border rounded-lg bg-card overflow-hidden">
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Recent Transactions
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleReloadTransactions}
                    disabled={isLoadingTransactions}
                  >
                    <IconRefresh className={`h-3.5 w-3.5 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {transactions.filter(t => t.paymentStatus === "paid").length} Paid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {transactions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm font-medium">No transactions yet</p>
                  <p className="text-xs mt-1">Complete a sale to see transactions here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-1">{transaction.transactionNumber}</div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          {transaction.items.length} {transaction.items.length === 1 ? "item" : "items"} • {formatCurrency(transaction.total)} • {transaction.paymentMethod === "cash" ? "💵 Cash" : "📱 Transfer"}
                        </div>
                        <div className="text-xs">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Badge
                        className={
                          transaction.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                        }
                      >
                        {transaction.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
                      </Badge>
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
                            >
                              <IconQrcode className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(transaction.id)}
                            className="h-8 text-xs"
                          >
                            Mark Paid
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main POS Interface - Products and Cart */}
      <div className="flex-1 min-h-[600px] lg:min-h-0 flex flex-col lg:flex-row gap-4 ">
        {/* Products Section - Table */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden min-h-[500px]">
          {/* Search and Filter Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 border-b bg-muted/30 flex-shrink-0">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

          {/* Products Table */}
          <div className="flex-1 overflow-auto">
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
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div>
                        <p className="text-sm font-medium">No products found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filter</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const cartQuantity = getCartQuantity(product.id)
                    return (
                      <TableRow key={product.id} className="hover:bg-muted/30">
                        <TableCell className="hidden sm:table-cell">
                          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-md overflow-hidden border">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 sm:block">
                            <div className="relative h-8 w-8 sm:hidden rounded-md overflow-hidden border flex-shrink-0">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
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
                                  onClick={() => updateQuantity(product.id, cartQuantity - 1)}
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
                                  onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                                >
                                  <IconPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeFromCart(product.id)}
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Cart Section - Fixed height */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col border rounded-lg bg-card overflow-hidden min-h-[400px] lg:h-auto">
          <Card className="border-0 shadow-none h-full flex flex-col">
            {/* Cart Header */}
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
            
            {/* Cart Content */}
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
                    {/* Cart Items */}
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="font-medium text-sm truncate">{item.productName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrencyCompact(item.price)} × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
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
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <IconPlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Price Summary */}
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

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={(value: "cash" | "transfer") => setPaymentMethod(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="transfer">📱 Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      onClick={handleCheckout}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
                      {paymentMethod === "cash" ? "Complete Payment" : "Generate QR Code"}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan to Pay</DialogTitle>
            <DialogDescription>
              Customer should scan this QR code with their phone to view invoice and complete payment
            </DialogDescription>
          </DialogHeader>
          {currentTransaction && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                  <QRCodeSVG
                    value={currentTransaction.qrCode || ""}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-xs text-center mt-2 text-muted-foreground font-mono">
                    {currentTransaction.transactionNumber}
                  </div>
                  <div className="text-[10px] text-center mt-1 text-muted-foreground break-all max-w-[200px] px-2">
                    {currentTransaction.qrCode}
                  </div>
                </div>
              </div>
              
              {/* Invoice Preview - What customer sees on their phone */}
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Invoice Preview</CardTitle>
                  <CardDescription className="text-xs">What customer will see after scanning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Transaction #</span>
                      <span className="font-mono">{currentTransaction.transactionNumber}</span>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      {currentTransaction.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-xs">
                          <span className="flex-1 truncate">{item.productName} × {item.quantity}</span>
                          <span className="ml-2">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowQRCode(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePaymentComplete}
                >
                  Mark as Paid
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}