"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { IconX, IconAlertCircle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PaymentErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get("message") || "An error occurred during payment"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <IconX className="h-5 w-5" />
            Payment Error
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What happened?</p>
                <p>There was an issue processing your payment. This could be due to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>Payment was cancelled</li>
                  <li>Network connectivity issues</li>
                  <li>Invalid payment information</li>
                  <li>Payment gateway error</li>
                </ul>
              </div>
            </div>
            <Button onClick={() => router.back()} className="w-full">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
