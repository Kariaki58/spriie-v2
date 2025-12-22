"use client"

import * as React from "react"

interface ThemeConfig {
  backgroundColor: string
  primaryColor: string
  accentColor: string
  logo: string | null
  storeName: string
  domain: string
}

interface ThemeContextType {
  theme: ThemeConfig
  updateTheme: (updates: Partial<ThemeConfig>) => void
}

const defaultTheme: ThemeConfig = {
  backgroundColor: "#ffffff",
  primaryColor: "#3b82f6",
  accentColor: "#8b5cf6",
  logo: null,
  storeName: "My Store",
  domain: "",
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeConfig>(defaultTheme)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch settings from API on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const settings = data.data
            const newTheme: ThemeConfig = {
              storeName: settings.storeName || defaultTheme.storeName,
              domain: settings.domain || defaultTheme.domain,
              logo: settings.logo || defaultTheme.logo,
              backgroundColor: settings.backgroundColor || defaultTheme.backgroundColor,
              primaryColor: settings.primaryColor || defaultTheme.primaryColor,
              accentColor: settings.accentColor || defaultTheme.accentColor,
            }
            setTheme(newTheme)
            // Also save to localStorage as fallback
            if (typeof window !== "undefined") {
              localStorage.setItem("store-theme", JSON.stringify(newTheme))
            }
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        // Fallback to localStorage if API fails
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("store-theme")
          if (saved) {
            try {
              setTheme({ ...defaultTheme, ...JSON.parse(saved) })
            } catch {
              // Keep default theme
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const updateTheme = React.useCallback((updates: Partial<ThemeConfig>) => {
    setTheme((prev) => {
      const newTheme = { ...prev, ...updates }
      // Save to localStorage as fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("store-theme", JSON.stringify(newTheme))
      }
      return newTheme
    })
  }, [])

  // Apply theme colors to CSS variables
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      root.style.setProperty("--theme-bg", theme.backgroundColor)
      root.style.setProperty("--theme-primary", theme.primaryColor)
      root.style.setProperty("--theme-accent", theme.accentColor)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeConfig() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useThemeConfig must be used within ThemeProvider")
  }
  return context
}







