import Product from "@/lib/models/product"
import mongoose from "mongoose"

interface OrderItem {
  productId: string | mongoose.Types.ObjectId
  quantity: number
  variant?: string // JSON string of variant attributes
  price: number
}

/**
 * Update product sold count and decrement stock when a sale is made
 * Handles both products with variants and without variants
 */
export async function updateProductSoldCount(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    try {
      const product = await Product.findById(item.productId)
      if (!product) {
        console.error(`Product ${item.productId} not found`)
        continue
      }

      // Parse variant if provided
      let variantAttributes: Array<{ name: string; value: string }> | null = null
      if (item.variant) {
        try {
          variantAttributes = typeof item.variant === "string" 
            ? JSON.parse(item.variant) 
            : item.variant
        } catch (e) {
          console.error("Error parsing variant:", e)
        }
      }

      // Update sold count and stock
      if (variantAttributes && product.variants && product.variants.length > 0) {
        // Product has variants - find and update the specific variant
        const variantIndex = product.variants.findIndex((v: any) => {
          if (!v.attributes || !Array.isArray(v.attributes)) return false
          
          return variantAttributes!.every((attr) => 
            v.attributes.some((vAttr: any) => 
              vAttr.name === attr.name && vAttr.value === attr.value
            )
          )
        })

        if (variantIndex >= 0) {
          const variant = product.variants[variantIndex]
          // Update variant stock
          variant.stock = Math.max(0, (variant.stock || 0) - item.quantity)
          
          // Update product sold count (increment by quantity)
          product.sold = (product.sold || 0) + item.quantity
          
          // Update product revenue (increment by item total)
          const itemTotal = item.price * item.quantity
          product.revenue = (product.revenue || 0) + itemTotal

          product.markModified("variants")
          await product.save()
        } else {
          console.error(`Variant not found for product ${product.name}`)
        }
      } else {
        // Product doesn't have variants - update product stock directly
        product.stock = Math.max(0, (product.stock || 0) - item.quantity)
        
        // Update product sold count
        product.sold = (product.sold || 0) + item.quantity
        
        // Update product revenue
        const itemTotal = item.price * item.quantity
        product.revenue = (product.revenue || 0) + itemTotal

        await product.save()
      }
    } catch (error) {
      console.error(`Error updating product ${item.productId}:`, error)
      // Continue processing other items even if one fails
    }
  }
}
