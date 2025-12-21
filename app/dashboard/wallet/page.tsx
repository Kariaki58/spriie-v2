"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { WalletMetrics } from "@/components/wallet/wallet-metrics"
import { WalletTransactionsTable } from "@/components/wallet/wallet-transactions-table"
import { useEffect, useState } from "react"

interface WalletBalance {
  available: number
  ledger: number
  currency: string
}

interface Transaction {
  id: string
  amount: number
  type: "credit" | "debit"
  status: "successful" | "failed" | "pending"
  date: string
  description: string
  senderOrReceiver: string
  reference: string
}

export default function Page() {
  const [balance, setBalance] = useState<WalletBalance>({
    available: 0,
    ledger: 0,
    currency: "NGN",
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch("/api/wallet/balance"),
        fetch("/api/wallet/transactions"),
      ])

      const balanceData = await balanceRes.json()
      const transactionsData = await transactionsRes.json()

      if (balanceData.success) {
        setBalance(balanceData.data)
      }

      if (transactionsData.success) {
        setTransactions(transactionsData.data)
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading wallet data...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
          </div>
          
          <WalletMetrics balance={balance} onSuccess={fetchWalletData} />
          
          <div className="space-y-4">
             <div>
                <h2 className="text-xl font-semibold tracking-tight">Transaction History</h2>
                <p className="text-sm text-muted-foreground">
                    View and manage your recent transactions.
                </p>
             </div>
             <WalletTransactionsTable transactions={transactions} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
