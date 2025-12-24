"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { IconCheck, IconX, IconReceipt, IconDownload } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { getTransactionById, updateTransactionStatus } from "@/lib/transaction-storage"
import { type POSTransaction } from "@/lib/pos-data"
import { getTestTransactions } from "@/lib/test-transactions"
import { downloadInvoice } from "@/lib/invoice-generator"

export function PaymentContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = params.transactionId as string
  const [transaction, setTransaction] = React.useState<POSTransaction | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [processing, setProcessing] = React.useState(false)

  React.useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) {
        setLoading(false)
        return
      }

      // First, check if it's a test transaction
      const testTransactions = getTestTransactions()
      const testTransaction = testTransactions.find(t => t.id === transactionId)
      
      if (testTransaction) {
        setTransaction(testTransaction)
        setLoading(false)
        return
      }
      
      // Try to get from localStorage
      const stored = getTransactionById(transactionId)
      if (stored) {
        setTransaction(stored)
        setLoading(false)
        return
      }
      
      // If not found locally, try to fetch from API
      try {
        const res = await fetch(`/api/pos/transactions/${transactionId}`)
        const data = await res.json()
        
        if (data.success && data.data) {
          // Map API response to POSTransaction format
          const apiTransaction = data.data
          const mappedTransaction: POSTransaction = {
            id: apiTransaction._id || apiTransaction.id,
            transactionNumber: apiTransaction.transactionNumber,
            items: apiTransaction.items || [],
            subtotal: apiTransaction.subtotal,
            tax: apiTransaction.tax,
            total: apiTransaction.total,
            paymentMethod: apiTransaction.paymentMethod,
            paymentStatus: apiTransaction.paymentStatus,
            qrCode: apiTransaction.qrCode,
            createdAt: apiTransaction.createdAt,
            paidAt: apiTransaction.paidAt,
          }
          setTransaction(mappedTransaction)
          setLoading(false)
        } else {
          setLoading(false)
          toast.error("Transaction not found. Please scan the QR code again.")
        }
      } catch (error) {
        console.error("Error fetching transaction:", error)
        setLoading(false)
        toast.error("Transaction not found. Please scan the QR code again.")
      }
    }

    loadTransaction()
  }, [transactionId])

  // Check for payment status in URL params after Flutterwave redirect
  React.useEffect(() => {
    if (!transaction) return

    const paymentStatus = searchParams.get("payment")
    const message = searchParams.get("message")
    
    if (paymentStatus === "success") {
      // Reload transaction to get latest status
      const reloadTransaction = () => {
        fetch(`/api/pos/transactions/${transaction.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              const apiTransaction = data.data
              const mappedTransaction: POSTransaction = {
                id: apiTransaction._id || apiTransaction.id,
                transactionNumber: apiTransaction.transactionNumber,
                items: apiTransaction.items || [],
                subtotal: apiTransaction.subtotal,
                tax: apiTransaction.tax,
                total: apiTransaction.total,
                paymentMethod: apiTransaction.paymentMethod,
                paymentStatus: apiTransaction.paymentStatus,
                qrCode: apiTransaction.qrCode,
                createdAt: apiTransaction.createdAt,
                paidAt: apiTransaction.paidAt,
              }
              setTransaction(mappedTransaction)
              
              if (mappedTransaction.paymentStatus === "paid") {
                toast.success("Payment completed successfully! ✅")
              } else {
                // Payment callback processed but webhook might be pending
                toast.info("Processing payment confirmation...")
              }
              
              // Clean up URL
              window.history.replaceState({}, "", `/payment/${transaction.id}`)
            }
          })
          .catch(err => {
            console.error("Error reloading transaction:", err)
          })
      }
      
      // Reload immediately and then once more after a short delay
      reloadTransaction()
      setTimeout(reloadTransaction, 2000)
    } else if (paymentStatus === "failed" || paymentStatus === "error") {
      toast.error(message || "Payment failed. Please try again.")
      // Clean up URL
      window.history.replaceState({}, "", `/payment/${transaction.id}`)
    }
  }, [transaction, searchParams])

  const handleCompletePayment = async () => {
    if (!transaction || transaction.paymentStatus === "paid") {
      toast.error("Payment already completed")
      return
    }

    if (transaction.paymentMethod !== "transfer") {
      toast.error("This transaction can only be paid via transfer")
      return
    }

    setProcessing(true)
    
    try {
      // Initialize Flutterwave payment
      const initRes = await fetch("/api/pos/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          email: "customer@example.com",
          name: "POS Customer",
        }),
      })

      const initData = await initRes.json()

      if (!initData.success || !initData.data.paymentLink) {
        toast.error(initData.error || "Failed to initialize payment")
        setProcessing(false)
        return
      }

      // Redirect to Flutterwave payment page
      window.location.href = initData.data.paymentLink
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Loading invoice...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <IconX className="h-5 w-5" />
              Transaction Not Found
            </CardTitle>
            <CardDescription>
              The transaction you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/pos")} className="w-full">
              Go to POS
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid = transaction.paymentStatus === "paid"

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <IconReceipt className="h-6 w-6 text-primary" />
                Invoice
              </CardTitle>
              <CardDescription className="mt-2">
                Transaction #{transaction.transactionNumber}
              </CardDescription>
            </div>
            <Badge
              className={
                isPaid
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
              }
            >
              {isPaid ? (
                <>
                  <IconCheck className="h-3.5 w-3.5 mr-1.5" />
                  Paid
                </>
              ) : (
                <>
                  <IconX className="h-3.5 w-3.5 mr-1.5" />
                  Pending
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium">
                {transaction.paymentMethod === "cash" ? "💵 Cash" : "📱 Bank Transfer"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>
            {isPaid && transaction.paidAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid At</span>
                <span className="font-medium">
                  {new Date(transaction.paidAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Items</h3>
            <div className="space-y-2">
              {transaction.items.map((item, index) => {
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
                    // If not JSON, use as string (fallback)
                    variantDisplay = item.variant
                  }
                }
                
                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex justify-between items-start p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      {variantDisplay && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {variantDisplay.split(", ").map((variantPart, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              {variantPart}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-primary ml-4">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT (7.5%)</span>
              <span className="font-medium">{formatCurrency(transaction.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Payment Button */}
          {!isPaid && transaction.paymentMethod === "transfer" && (
            <div className="pt-4">
              <Button
                onClick={handleCompletePayment}
                disabled={processing}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Redirecting to Payment...
                  </>
                ) : (
                  "Pay Now with Flutterwave"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                You will be redirected to Flutterwave to complete your payment securely
              </p>
            </div>
          )}

          {!isPaid && transaction.paymentMethod === "cash" && (
            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                <IconReceipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Cash payment - Please pay at the counter
                </span>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                <IconCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-emerald-700 dark:text-emerald-300">
                  Payment completed successfully! ✅
                </span>
              </div>
              {transaction.paidAt && (
                <div className="text-center text-sm text-muted-foreground">
                  Paid on {new Date(transaction.paidAt).toLocaleString()}
                </div>
              )}
              <Button
                onClick={() => {
                  try {
                    downloadInvoice({
                      transactionNumber: transaction.transactionNumber,
                      items: transaction.items,
                      subtotal: transaction.subtotal,
                      tax: transaction.tax,
                      total: transaction.total,
                      paymentMethod: transaction.paymentMethod,
                      paymentStatus: transaction.paymentStatus,
                      createdAt: transaction.createdAt,
                      paidAt: transaction.paidAt,
                    }, `invoice-${transaction.transactionNumber}.pdf`)
                  } catch (error) {
                    console.error("Error downloading invoice:", error)
                    toast.error("Failed to generate invoice. Please try again.")
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <IconDownload className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
