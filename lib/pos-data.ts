import { dummyProducts } from "./dummy-data"
import { getAppBaseUrl } from "./app-url"

export interface POSCartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  variant?: string
}

export interface POSTransaction {
  id: string
  transactionNumber: string
  items: POSCartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "transfer"
  paymentStatus: "pending" | "paid" | "cancelled"
  qrCode?: string
  createdAt: string
  paidAt?: string
}

// Generate QR code data - points to the application's payment page
// Only includes transaction ID - transaction data is looked up on the payment page
export function generateQRCodeData(transactionId: string): string {
  const baseUrl = getAppBaseUrl()
  return `${baseUrl}/payment/${transactionId}`
}

export function createTransaction(
  items: POSCartItem[],
  paymentMethod: "cash" | "transfer"
): POSTransaction {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.075 // 7.5% VAT
  const total = subtotal + tax
  const transactionId = `TXN-${Date.now()}`
  const transactionNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`

  const transaction: POSTransaction = {
    id: transactionId,
    transactionNumber,
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
    qrCode: undefined, // Will be set after transaction is created
    createdAt: new Date().toISOString(),
    paidAt: paymentMethod === "cash" ? new Date().toISOString() : undefined,
  }

  // Generate QR code with just the transaction ID
  if (paymentMethod === "transfer") {
    transaction.qrCode = generateQRCodeData(transaction.id)
  }

  return transaction
}

export const posProducts = dummyProducts.map((product) => ({
  ...product,
  availableForPOS: true,
}))

