"use client"

import * as React from "react"
import { IconPlus, IconTrash, IconX, IconUpload } from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"


export function AddProductModal({ children, onSuccess }: { children?: React.ReactNode, onSuccess?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Form State
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [stock, setStock] = React.useState("") // Base stock if no variants
  
  // Images
  const [images, setImages] = React.useState<File[]>([])
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([])

  // Variants
  const [hasVariants, setHasVariants] = React.useState(false)
  const [variantAttributes, setVariantAttributes] = React.useState<string[]>([]) 
  const [variants, setVariants] = React.useState<{ attributes: Record<string, string>, stock: string, price: string }[]>([])

  // UI State for adding attribute
  const [isAddingAttribute, setIsAddingAttribute] = React.useState(false)
  const [newAttributeName, setNewAttributeName] = React.useState("")

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Filter images only
      const validFiles = newFiles.filter(file => file.type.startsWith('image/'))
      
      if (validFiles.length !== newFiles.length) {
        toast.error("Some files were skipped because they are not images.")
      }

      setImages(prev => [...prev, ...validFiles])

      // Create previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      // Revoke URL to avoid memory leaks
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const confirmAddAttribute = () => {
    if (!newAttributeName.trim()) {
      setIsAddingAttribute(false)
      return
    }
    
    if (variantAttributes.includes(newAttributeName)) {
      toast.error("Attribute already exists.")
      return
    }

    setVariantAttributes([...variantAttributes, newAttributeName])
    // Update existing variants to include this new attribute
    setVariants(variants.map(v => ({
      ...v,
      attributes: { ...v.attributes, [newAttributeName]: "" }
    })))
    
    setNewAttributeName("")
    setIsAddingAttribute(false)
  }

  const cancelAddAttribute = () => {
    setNewAttributeName("")
    setIsAddingAttribute(false)
  }

  const removeVariantAttribute = (attr: string) => {
    if (variantAttributes.length <= 1) {
       toast.error("You must have at least one variant attribute.")
       return
    }
    setVariantAttributes(variantAttributes.filter(a => a !== attr))
     // Update existing variants to remove this attribute
     setVariants(variants.map(v => {
        const newAttrs = { ...v.attributes }
        delete newAttrs[attr]
        return { ...v, attributes: newAttrs }
     }))
  }

  const addVariant = () => {
    const newVariantAttributes: Record<string, string> = {}
    variantAttributes.forEach(attr => newVariantAttributes[attr] = "")
    setVariants([...variants, { attributes: newVariantAttributes, stock: "", price: "" }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: string, value: string, isAttribute: boolean = false) => {
    const newVariants = [...variants]
    if (isAttribute) {
        newVariants[index].attributes[field] = value
    } else {
        newVariants[index][field] = value
    }
    setVariants(newVariants)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Upload Images (Mocking for now, or using base64)
      const imageBase64s = await Promise.all(images.map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
      }))

        // Map variants to new schema structure
        const formattedVariants = hasVariants ? variants.map(v => ({
            attributes: Object.entries(v.attributes).map(([key, value]) => ({
                name: key,
                value: value as string
            })),
            stock: parseInt(v.stock) || 0,
            price: parseFloat(v.price) || parseFloat(price)
        })) : []

        const payload = {
        name,
        description,
        category,
        price: parseFloat(price),
        stock: hasVariants ? variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0) : parseInt(stock),
        images: imageBase64s,
        variants: formattedVariants
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to create product')

      toast.success("Product created successfully!")
      setOpen(false)
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset form
      setName("")
      setDescription("")
      setCategory("")
      setPrice("")
      setStock("")
      setImages([])
      setImagePreviews([])
      setVariants([])
      setVariantAttributes([])
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product with multiple variants and images.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g. Vintage T-Shirt"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g. Men's Wear"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your product..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Pricing & Stock (Base) */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="price">Base Price (₦)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>
            {!hasVariants && (
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  required={!hasVariants}
                />
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="grid grid-cols-4 gap-4">
                {/* Upload Button */}
                <div className="relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors h-32">
                    <IconUpload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center">Upload Images</span>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageUpload}
                    />
                </div>

                {/* Previews */}
                {imagePreviews.map((src, index) => (
                    <div key={index} className="relative group border rounded-lg overflow-hidden h-32 bg-muted">
                        <Image 
                            src={src} 
                            alt={`Preview ${index}`} 
                            fill 
                            className="object-cover" 
                            unoptimized 
                        />
                         <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <IconX className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
          </div>

          {/* Variants Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="has-variants" 
                        checked={hasVariants}
                        onCheckedChange={(checked) => setHasVariants(checked as boolean)}
                    />
                    <Label htmlFor="has-variants" className="font-medium">This product has variants</Label>
                </div>
                {hasVariants && (
                    <div className="flex items-center gap-2">
                        {isAddingAttribute ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                <Input 
                                    className="h-8 w-[150px]" 
                                    placeholder="e.g. Fabric" 
                                    value={newAttributeName}
                                    onChange={(e) => setNewAttributeName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            confirmAddAttribute()
                                        }
                                    }}
                                    autoFocus
                                />
                                <Button type="button" size="sm" onClick={confirmAddAttribute}>Add</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={cancelAddAttribute}>
                                    <IconX className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingAttribute(true)}>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Attribute
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {hasVariants && (
                <div className="space-y-4">
                    {variantAttributes.length === 0 ? (
                         <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg border border-dashed">
                            <p>No attributes defined.</p>
                            <p className="text-sm">Click &quot;Add Attribute&quot; to define product options (e.g. Size, Color).</p>
                         </div>
                    ) : (
                        <>
                    {/* Header Row */}
                    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${variantAttributes.length}, 1fr) 100px 80px 40px` }}>
                        {variantAttributes.map((attr) => (
                             <div key={attr} className="font-medium text-xs flex items-center justify-between group">
                                {attr}
                                <button type="button" onClick={() => removeVariantAttribute(attr)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                                    <IconX className="h-3 w-3" />
                                </button>
                             </div>
                        ))}
                         <div className="font-medium text-xs">Price</div>
                         <div className="font-medium text-xs">Stock</div>
                         <div></div>
                    </div>

                    {variants.map((variant, index) => (
                        <div key={index} className="grid gap-2 items-center" style={{ gridTemplateColumns: `repeat(${variantAttributes.length}, 1fr) 100px 80px 40px` }}>
                             {variantAttributes.map((attr) => (
                                 <Input 
                                    key={attr}
                                    placeholder={attr} 
                                    className="h-8"
                                    value={variant.attributes[attr] || ""}
                                    onChange={e => updateVariant(index, attr, e.target.value, true)}
                                />
                             ))}
                             <Input 
                                placeholder={price || "0.00"} 
                                className="h-8"
                                type="number"
                                value={variant.price}
                                onChange={e => updateVariant(index, 'price', e.target.value)}
                            />
                             <Input 
                                placeholder="0" 
                                className="h-8"
                                type="number"
                                value={variant.stock}
                                onChange={e => updateVariant(index, 'stock', e.target.value)}
                            />
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeVariant(index)}
                                disabled={variants.length === 1}
                            >
                                <IconTrash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addVariant}
                        className="mt-2"
                    >
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Variant Row
                    </Button>
                    </>
                )}
                </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
