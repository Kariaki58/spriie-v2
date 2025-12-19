export type TransactionStatus = "successful" | "failed" | "pending"
export type TransactionType = "credit" | "debit"

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  date: string
  description: string
  senderOrReceiver: string
  reference: string
}

export interface WalletBalance {
  available: number
  ledger: number
  currency: string
}

export const dummyWalletBalance: WalletBalance = {
  available: 2504500.50,
  ledger: 2550000.00,
  currency: "NGN",
}

export const dummyTransactions: Transaction[] = [
  {
    id: "TRX-1001",
    amount: 150000.00,
    type: "credit",
    status: "successful",
    date: "2024-04-15T10:30:00Z",
    description: "Funds added via Bank Transfer",
    senderOrReceiver: "Chase Bank",
    reference: "REF-001",
  },
  {
    id: "TRX-1002",
    amount: 25000.00,
    type: "debit",
    status: "successful",
    date: "2024-04-14T14:20:00Z",
    description: "Withdrawal to Bank Account",
    senderOrReceiver: "Wells Fargo",
    reference: "REF-002",
  },
  {
    id: "TRX-1003",
    amount: 50.00,
    type: "debit",
    status: "pending",
    date: "2024-04-14T09:15:00Z",
    description: "Service Fee",
    senderOrReceiver: "System",
    reference: "REF-003",
  },
  {
    id: "TRX-1004",
    amount: 1200.75,
    type: "credit",
    status: "successful",
    date: "2024-04-12T16:45:00Z",
    description: "Payment from Customer",
    senderOrReceiver: "Alice Smith",
    reference: "REF-004",
  },
  {
    id: "TRX-1005",
    amount: 500.00,
    type: "debit",
    status: "failed",
    date: "2024-04-10T11:00:00Z",
    description: "Withdrawal attempted",
    senderOrReceiver: "Chase Bank",
    reference: "REF-005",
  },
  {
    id: "TRX-1006",
    amount: 300.00,
    type: "credit",
    status: "successful",
    date: "2024-04-09T13:20:00Z",
    description: "Refund processed",
    senderOrReceiver: "Vendor XYZ",
    reference: "REF-006",
  },
  {
    id: "TRX-1007",
    amount: 75.50,
    type: "debit",
    status: "successful",
    date: "2024-04-08T15:10:00Z",
    description: "Monthly Subscription",
    senderOrReceiver: "Service Provider",
    reference: "REF-007",
  },
   {
    id: "TRX-1008",
    amount: 2100.00,
    type: "credit",
    status: "successful",
    date: "2024-04-07T09:30:00Z",
    description: "Sales payout",
    senderOrReceiver: "Spriie Payouts",
    reference: "REF-008",
  },
  {
    id: "TRX-1009",
    amount: 100.00,
    type: "debit",
    status: "pending",
    date: "2024-04-06T12:00:00Z",
    description: "Withdrawal Request",
    senderOrReceiver: "Bank of America",
    reference: "REF-009",
  },
  {
    id: "TRX-1010",
    amount: 450.25,
    type: "credit",
    status: "successful",
    date: "2024-04-05T14:15:00Z",
    description: "Direct Deposit",
    senderOrReceiver: "Client ABC",
    reference: "REF-010",
  },
]
