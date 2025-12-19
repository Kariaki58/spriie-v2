"use client"

import * as React from "react"
import { IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface WithdrawWalletDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawWalletDialog({ children, open, onOpenChange }: WithdrawWalletDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [amount, setAmount] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      onOpenChange(false)
      setAmount("")
      toast.success("Withdrawal initiated", {
        description: `Your request to withdraw ₦${amount} has been submitted.`,
      })
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw available funds to your linked bank account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="withdraw-amount"
                  placeholder="0.00"
                  className="pl-7"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="bank-account">Bank Account</Label>
                <Input id="bank-account" value="**** **** **** 4242" disabled />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw Funds
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
