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
  const [theme, setTheme] = React.useState<ThemeConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("store-theme")
      if (saved) {
        try {
          return { ...defaultTheme, ...JSON.parse(saved) }
        } catch {
          return defaultTheme
        }
      }
    }
    return defaultTheme
  })

  const updateTheme = React.useCallback((updates: Partial<ThemeConfig>) => {
    setTheme((prev) => {
      const newTheme = { ...prev, ...updates }
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







