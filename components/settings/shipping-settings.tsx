"use client"

import { useState, useEffect } from "react"
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from "react-country-state-city"
import "react-country-state-city/dist/react-country-state-city.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { IconTrash, IconLoader } from "@tabler/icons-react"

interface ShippingRate {
  _id: string
  country: string
  state?: string
  city?: string
  price: number
  isGlobal?: boolean
}

const selectClassName = "w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";


export function ShippingSettings() {
  const [countryid, setCountryid] = useState(0)
  const [stateid, setStateid] = useState(0)
  const [cityid, setCityid] = useState(0)

  const [countryName, setCountryName] = useState("")
  const [stateName, setStateName] = useState("")
  const [cityName, setCityName] = useState("")
  
  const [price, setPrice] = useState("")
  const [globalPrice, setGlobalPrice] = useState("")
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(false)
  const [globalLoading, setGlobalLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/shipping-rates")
      if (res.ok) {
        const data = await res.json()
        setRates(data.filter((r: ShippingRate) => !r.isGlobal))
        const globalRate = data.find((r: ShippingRate) => r.isGlobal)
        if (globalRate) {
            setGlobalPrice(globalRate.price.toString())
        }
      }
    } catch (error) {
      console.error("Failed to fetch rates", error)
    } finally {
        setFetching(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
        const res = await fetch(`/api/shipping-rates?id=${id}`, {
            method: "DELETE"
        })
        if (res.ok) {
            toast.success("Rate deleted")
            setRates(rates.filter(r => r._id !== id))
        } else {
            toast.error("Failed to delete rate")
        }
    } catch (error) {
        console.error("Error deleting rate", error)
        toast.error("Error deleting rate")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!countryName || !price) {
      toast.error("Country and Price are required")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: countryName,
          state: stateName || null,
          city: cityName || null,
          price: parseFloat(price),
        }),
      })

      if (res.ok) {
        const newRate = await res.json()
        setRates([newRate, ...rates])
        toast.success("Shipping rate added")
        // Reset form
        setPrice("")
        // Note: Resetting country/state/city in this library might require resetting IDs
        // For now we keep them to allow easy addition of multiple cities in same state
      } else {
        toast.error("Failed to add rate")
      }
    } catch (error) {
      console.error("Error adding rate", error)
      toast.error("Error adding rate")
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setGlobalLoading(true)
      try {
          const res = await fetch("/api/shipping-rates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  price: parseFloat(globalPrice),
                  isGlobal: true
              })
          })
          
          if (res.ok) {
              toast.success("Global shipping rate updated")
          } else {
              toast.error("Failed to update global rate")
          }
      } catch (error) {
          console.error("Error updating global rate", error)
          toast.error("Error updating global rate")
      } finally {
          setGlobalLoading(false)
      }
  }

  return (
    <div className="grid gap-6">
      <Card>
          <CardHeader>
              <CardTitle>Global Flat Rate</CardTitle>
              <CardDescription>
                  Set a fallback shipping price for any location not covered by specific rates below.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleGlobalSubmit} className="flex items-end gap-4">
                 <div className="space-y-2 flex-1">
                    <Label htmlFor="global-price">Flat Rate Price</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₦
                        </span>
                        <Input
                        id="global-price"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={globalPrice}
                        onChange={(e) => setGlobalPrice(e.target.value)}
                        />
                    </div>
                 </div>
                 <Button type="submit" disabled={globalLoading}>
                    {globalLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                    Save Flat Rate
                 </Button>
              </form>
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Shipping Rate</CardTitle>
          <CardDescription>
            Configure shipping prices for specific locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Country</Label>
                <CountrySelect
                  onChange={(e: any) => {
                    setCountryid(e.id)
                    setCountryName(e.name)
                    setStateid(0)
                    setStateName("")
                    setCityid(0)
                    setCityName("")
                  }}
                  placeHolder="Select Country"
                  className={selectClassName}
                />
              </div>
              
              <div className="space-y-2">
                <Label>State / Region</Label>
                <StateSelect
                  countryid={countryid}
                  onChange={(e: any) => {
                    setStateid(e.id)
                    setStateName(e.name)
                    setCityid(0)
                    setCityName("")
                  }}
                  placeHolder="Select State"
                  className={selectClassName}
                />
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <CitySelect
                  countryid={countryid}
                  stateid={stateid}
                  onChange={(e: { id: number; name: string }) => {
                    setCityid(e.id)
                    setCityName(e.name)
                  }}
                  placeHolder="Select City"
                  className={selectClassName}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="price">Shipping Price</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₦
                        </span>
                        <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        />
                    </div>
                 </div>
                 <div className="flex items-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                        Add Rate
                    </Button>
                 </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Rates</CardTitle>
          <CardDescription>
            Manage your configured shipping rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {fetching ? (
                <div className="flex justify-center p-4">
                    <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                          No rates configured yet.
                      </TableCell>
                  </TableRow>
              ) : (
                  rates.map((rate) => (
                    <TableRow key={rate._id}>
                      <TableCell>
                        <div className="font-medium">{rate.country}</div>
                        <div className="text-sm text-muted-foreground">
                          {[rate.state, rate.city].filter(Boolean).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>₦{rate.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rate._id)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/20"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
