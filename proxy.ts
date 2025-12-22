import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = (token as any)?.isAdmin ?? false
    const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard")

    // If user is not admin and trying to access dashboard, redirect to /account
    if (isDashboardRoute && !isAdmin) {
      return NextResponse.redirect(new URL("/account", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ["/", "/payment", "/auth"]
        const isPublicRoute = publicRoutes.some((route) =>
          req.nextUrl.pathname.startsWith(route)
        )

        if (isPublicRoute) {
          return true
        }

        // Require authentication for dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }

        // Allow access to /account if authenticated
        if (req.nextUrl.pathname === "/account") {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/account"],
}

