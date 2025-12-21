"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GoogleAuthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user is admin
      const isAdmin = (session as any)?.isAdmin ?? false
      if (isAdmin) {
        router.push("/dashboard")
      } else {
        router.push("/account")
      }
    }
  }, [session, status, router])

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <Button onClick={handleSignIn} size="lg">
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}

