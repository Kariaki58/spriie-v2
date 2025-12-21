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
import { useSession } from "next-auth/react"

interface FundWalletDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function FundWalletDialog({ children, open, onOpenChange, onSuccess }: FundWalletDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          email: session?.user?.email,
          name: session?.user?.name,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to Flutterwave payment page
        window.location.href = data.data.paymentLink
      } else {
        toast.error(data.error || "Failed to initialize payment")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Fund wallet error:", error)
      toast.error("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fund Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet using your text-emerald-600 card or bank account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="amount"
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
              Add Funds
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
