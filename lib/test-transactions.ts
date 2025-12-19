import { type POSTransaction } from "./pos-data"
import { getAppBaseUrl } from "./app-url"

// List of 4 test transaction IDs for demo/testing
export const TEST_TRANSACTION_IDS = [
  "TXN-TEST-001",
  "TXN-TEST-002",
  "TXN-TEST-003",
  "TXN-TEST-004",
]

// Generate test transactions
export function getTestTransactions(): POSTransaction[] {
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}`
    : "http://localhost:3000"
  
  const tx1: POSTransaction = {
    id: "TXN-TEST-001",
    transactionNumber: "POS-20250120-001",
    items: [
      {
        productId: "1",
        productName: "Wireless Headphones",
        price: 25000,
        quantity: 2,
      },
      {
        productId: "2",
        productName: "Smart Watch",
        price: 45000,
        quantity: 1,
      },
    ],
    subtotal: 95000,
    tax: 7125,
    total: 102125,
    paymentMethod: "transfer",
    paymentStatus: "pending",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  }
  tx1.qrCode = `${baseUrl}/payment/${tx1.id}`

  const tx2: POSTransaction = {
    id: "TXN-TEST-002",
    transactionNumber: "POS-20250120-002",
    items: [
      {
        productId: "3",
        productName: "Laptop Stand",
        price: 15000,
        quantity: 1,
      },
      {
        productId: "4",
        productName: "USB-C Cable",
        price: 5000,
        quantity: 3,
      },
    ],
    subtotal: 30000,
    tax: 2250,
    total: 32250,
    paymentMethod: "transfer",
    paymentStatus: "pending",
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  }
  tx2.qrCode = `${baseUrl}/payment/${tx2.id}`

  const tx3: POSTransaction = {
    id: "TXN-TEST-003",
    transactionNumber: "POS-20250120-003",
    items: [
      {
        productId: "5",
        productName: "Mechanical Keyboard",
        price: 35000,
        quantity: 1,
      },
      {
        productId: "6",
        productName: "Wireless Mouse",
        price: 12000,
        quantity: 1,
      },
    ],
    subtotal: 47000,
    tax: 3525,
    total: 50525,
    paymentMethod: "transfer",
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    paidAt: new Date(Date.now() - 10700000).toISOString(), // Paid 1 minute after creation
  }
  tx3.qrCode = `${baseUrl}/payment/${tx3.id}`

  const tx4: POSTransaction = {
    id: "TXN-TEST-004",
    transactionNumber: "POS-20250120-004",
    items: [
      {
        productId: "7",
        productName: "Monitor Stand",
        price: 18000,
        quantity: 2,
      },
    ],
    subtotal: 36000,
    tax: 2700,
    total: 38700,
    paymentMethod: "cash",
    paymentStatus: "paid",
    createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    paidAt: new Date(Date.now() - 14400000).toISOString(),
  }

  return [tx1, tx2, tx3, tx4]
}

