"use client"

import * as React from "react"
import { IconLoader, IconCheck } from "@tabler/icons-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface WithdrawWalletDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  availableBalance: number
}

interface Bank {
  code: string
  name: string
}

export function WithdrawWalletDialog({
  children,
  open,
  onOpenChange,
  onSuccess,
  availableBalance,
}: WithdrawWalletDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [bankCode, setBankCode] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [verifiedAccountName, setVerifiedAccountName] = React.useState("")
  const [banks, setBanks] = React.useState<Bank[]>([])
  const [step, setStep] = React.useState<"details" | "verify" | "confirm">("details")

  React.useEffect(() => {
    if (open) {
      fetchBanks()
      // Reset form when dialog opens
      setAmount("")
      setAccountNumber("")
      setBankCode("")
      setAccountName("")
      setVerifiedAccountName("")
      setStep("details")
    }
  }, [open])

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/wallet/banks")
      const data = await response.json()
      if (data.success) {
        setBanks(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch banks:", error)
    }
  }

  const handleVerifyAccount = async () => {
    if (!accountNumber || !bankCode) {
      toast.error("Please fill in account number and select a bank")
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch("/api/wallet/verify-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setVerifiedAccountName(data.data.accountName)
        setAccountName(data.data.accountName)
        setStep("confirm")
        toast.success("Account verified successfully")
      } else {
        toast.error(data.error || "Failed to verify account")
      }
    } catch (error: any) {
      console.error("Verify account error:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (parseFloat(amount) > availableBalance) {
      toast.error("Insufficient balance")
      return
    }

    if (!accountNumber || !bankCode || !accountName) {
      toast.error("Please verify your account details")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountNumber,
          bankCode,
          accountName,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Withdrawal initiated successfully", {
          description: `Your request to withdraw ₦${parseFloat(amount).toLocaleString()} has been submitted.`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || "Failed to initiate withdrawal")
      }
    } catch (error: any) {
      console.error("Withdraw error:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
        {step === "details" && (
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
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available: ₦{availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-select">Select Bank</Label>
              <Select value={bankCode} onValueChange={setBankCode} required>
                <SelectTrigger id="bank-select">
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter account number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleVerifyAccount}
                disabled={isVerifying || !accountNumber || !bankCode || !amount}
              >
                {isVerifying && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                Verify Account
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <IconCheck className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">Account Verified</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Account Name:</p>
                    <p className="font-medium">{verifiedAccountName}</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Account Number:</p>
                    <p className="font-medium">{accountNumber}</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Amount:</p>
                    <p className="font-medium">₦{parseFloat(amount || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Withdrawal
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
