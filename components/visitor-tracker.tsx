"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Client-side component to track page visits
 * This component automatically tracks page views when mounted
 */
export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track dashboard/admin pages (they're internal)
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/api")) {
      return
    }

    // Track the visit
    const trackVisit = async () => {
      try {
        await fetch("/api/visitors/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: pathname || "/",
            referrer: document.referrer || null,
          }),
        })
      } catch (error) {
        // Silently fail - visitor tracking shouldn't break the site
        console.error("Failed to track visit:", error)
      }
    }

    // Small delay to ensure page is loaded
    const timer = setTimeout(trackVisit, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return null // This component doesn't render anything
}
