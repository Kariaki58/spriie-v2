"use client"

import { IconWallet, IconArrowUpRight, IconArrowDownLeft, IconCreditCard } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FundWalletDialog } from "@/components/wallet/fund-wallet-dialog"
import { WithdrawWalletDialog } from "@/components/wallet/withdraw-wallet-dialog"
import { WalletBalance } from "@/lib/wallet-data"
import { useState } from "react"

interface WalletMetricsProps {
  balance: WalletBalance
}

export function WalletMetrics({ balance }: WalletMetricsProps) {
  const [fundOpen, setFundOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Balance
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              ₦{balance.available.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex gap-2">
               <FundWalletDialog open={fundOpen} onOpenChange={setFundOpen}>
                 <Button size="sm" className="gap-1">
                  <IconArrowUpRight className="h-4 w-4" />
                  Fund Wallet
                </Button>
               </FundWalletDialog>
               
               <WithdrawWalletDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <Button size="sm" variant="outline" className="gap-1">
                  <IconArrowDownLeft className="h-4 w-4" />
                  Withdraw
                </Button>
               </WithdrawWalletDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="text-xs text-muted-foreground mt-1">
             Ledger Balance: ₦{balance.ledger.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Credits</CardTitle>
          <IconArrowDownLeft className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦230,000.00</div>
          <p className="text-xs text-muted-foreground">
            +10.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Debits</CardTitle>
          <IconArrowUpRight className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦15,000.00</div>
          <p className="text-xs text-muted-foreground">
            +2.5% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
