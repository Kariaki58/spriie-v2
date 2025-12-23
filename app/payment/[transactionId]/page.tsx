import { Suspense } from "react"
import { PaymentContent } from "./payment-content"

function PaymentFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-4 border rounded-lg">
        <div className="text-center text-muted-foreground">
          Loading invoice...
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  )
}
