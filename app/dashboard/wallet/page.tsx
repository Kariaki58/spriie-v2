import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { WalletMetrics } from "@/components/wallet/wallet-metrics"
import { WalletTransactionsTable } from "@/components/wallet/wallet-transactions-table"
import { dummyWalletBalance, dummyTransactions } from "@/lib/wallet-data"

export default function Page() {
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
          
          <WalletMetrics balance={dummyWalletBalance} />
          
          <div className="space-y-4">
             <div>
                <h2 className="text-xl font-semibold tracking-tight">Transaction History</h2>
                <p className="text-sm text-muted-foreground">
                    View and manage your recent transactions.
                </p>
             </div>
             <WalletTransactionsTable transactions={dummyTransactions} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
