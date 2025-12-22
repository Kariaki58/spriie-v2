"use client"

import * as React from "react"
import { IconUpload, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"
import { useThemeConfig } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function SettingsForm() {
  const { theme, updateTheme } = useThemeConfig()
  const [storeName, setStoreName] = React.useState(theme.storeName)
  const [domain, setDomain] = React.useState(theme.domain)
  const [backgroundColor, setBackgroundColor] = React.useState(theme.backgroundColor)
  const [primaryColor, setPrimaryColor] = React.useState(theme.primaryColor)
  const [accentColor, setAccentColor] = React.useState(theme.accentColor)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(theme.logo)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const settings = data.data
          setStoreName(settings.storeName || "My Store")
          setDomain(settings.domain || "")
          setBackgroundColor(settings.backgroundColor || "#ffffff")
          setPrimaryColor(settings.primaryColor || "#3b82f6")
          setAccentColor(settings.accentColor || "#8b5cf6")
          setLogoPreview(settings.logo || null)
          
          // Update theme context
          updateTheme({
            storeName: settings.storeName || "My Store",
            domain: settings.domain || "",
            backgroundColor: settings.backgroundColor || "#ffffff",
            primaryColor: settings.primaryColor || "#3b82f6",
            accentColor: settings.accentColor || "#8b5cf6",
            logo: settings.logo || null,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeName,
          domain,
          backgroundColor,
          primaryColor,
          accentColor,
          logo: logoPreview,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to save settings")
        return
      }

      // Update theme context
      updateTheme({
        storeName,
        domain,
        backgroundColor,
        primaryColor,
        accentColor,
        logo: logoPreview,
      })

      toast.success("Settings saved successfully!")
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast.error(error.message || "An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Customize your store appearance and branding
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize your store name and logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    ref={fileInputRef}
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconUpload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload your store logo (PNG, JPG, or SVG)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain</CardTitle>
            <CardDescription>
              Configure your store domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="mystore.com"
              />
              <p className="text-sm text-muted-foreground">
                Enter your custom domain name
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Colors</CardTitle>
            <CardDescription>
              Customize your store's color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div
                className="rounded-md p-4 text-sm"
                style={{
                  backgroundColor: backgroundColor,
                  color: primaryColor,
                }}
              >
                <div className="font-semibold" style={{ color: primaryColor }}>
                  Sample Text with Primary Color
                </div>
                <div className="mt-2" style={{ color: accentColor }}>
                  Sample Text with Accent Color
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}







