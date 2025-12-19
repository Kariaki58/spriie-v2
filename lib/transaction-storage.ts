import { type POSTransaction } from "./pos-data"
import { getTestTransactions } from "./test-transactions"

const STORAGE_KEY = "pos_transactions"

// Store transaction in localStorage
export function storeTransaction(transaction: POSTransaction): void {
  if (typeof window === "undefined") return
  
  const existing = getStoredTransactions()
  const updated = [...existing, transaction]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

// Get all stored transactions
export function getStoredTransactions(): POSTransaction[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Get a specific transaction by ID
export function getTransactionById(transactionId: string): POSTransaction | null {
  const transactions = getStoredTransactions()
  const found = transactions.find((t) => t.id === transactionId)
  
  // If not found in storage, check test transactions
  if (!found) {
    const testTransactions = getTestTransactions()
    return testTransactions.find((t) => t.id === transactionId) || null
  }
  
  return found
}

// Update transaction status
export function updateTransactionStatus(
  transactionId: string,
  status: "pending" | "paid" | "cancelled",
  paidAt?: string
): void {
  if (typeof window === "undefined") return
  
  const transactions = getStoredTransactions()
  const updated = transactions.map((t) =>
    t.id === transactionId
      ? { ...t, paymentStatus: status, paidAt: paidAt || t.paidAt }
      : t
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

