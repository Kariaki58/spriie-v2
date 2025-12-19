// Get the base URL for the application
// In production, this will be the Vercel URL
// In development, it will be localhost

export function getAppBaseUrl(): string {
  // Client-side: use window location
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`
  }
  
  // Server-side: check environment variables
  // NEXT_PUBLIC_APP_URL should be set in production (e.g., https://your-app.vercel.app)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Vercel automatically provides this
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  // Fallback for local development
  return "http://localhost:3000"
}

