import { Suspense } from "react"
import { ErrorContent } from "./error-content"

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-4 border rounded-lg">
        <div className="text-center text-muted-foreground">
          Loading error details...
        </div>
      </div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<ErrorFallback />}>
      <ErrorContent />
    </Suspense>
  )
}
