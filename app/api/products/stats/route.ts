import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/product"

export async function GET() {
  try {
    await dbConnect()
    const products = await Product.find()

    // Calculate statistics
    const totalProducts = products.length
    const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0)
    
    // Calculate low stock count - count individual items (variants or products)
    // If product has variants, count each low stock variant separately
    // If product has no variants, count the product itself
    const lowStockCount = products.reduce((count, p) => {
      if (p.variants && p.variants.length > 0) {
        // Count each variant with low stock (< 20)
        const lowStockVariants = p.variants.filter(variant => (variant.stock || 0) < 20)
        return count + lowStockVariants.length
      } else {
        // No variants, check product stock - count as 1 if low stock
        return (p.stock || 0) < 20 ? count + 1 : count
      }
    }, 0)
    
    // Calculate total inventory value - handle variants properly
    const totalInventoryValue = products.reduce((sum, p) => {
      if (p.variants && p.variants.length > 0) {
        // Sum up value of all variants (variant.price × variant.stock)
        const variantValue = p.variants.reduce((variantSum: number, variant) => {
          return variantSum + ((variant.price || p.price) * (variant.stock || 0))
        }, 0)
        return sum + variantValue
      } else {
        // No variants, use product price × stock
        return sum + (p.price * p.stock)
      }
    }, 0)

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        totalRevenue,
        lowStockCount,
        totalInventoryValue,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching product stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
