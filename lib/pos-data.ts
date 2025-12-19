import { dummyProducts } from "./dummy-data"

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

// Generate QR code data (in real app, this would be a payment link)
function generateQRCodeData(transactionId: string, amount: number): string {
  return `https://payment.example.com/pay?txn=${transactionId}&amount=${amount}&currency=NGN`
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

  return {
    id: transactionId,
    transactionNumber,
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    paymentStatus: paymentMethod === "cash" ? "paid" : "pending",
    qrCode: paymentMethod === "transfer" ? generateQRCodeData(transactionId, total) : undefined,
    createdAt: new Date().toISOString(),
    paidAt: paymentMethod === "cash" ? new Date().toISOString() : undefined,
  }
}

export const posProducts = dummyProducts.map((product) => ({
  ...product,
  availableForPOS: true,
}))

