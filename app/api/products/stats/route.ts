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
    const lowStockCount = products.filter(p => p.stock < 20).length
    
    // Calculate total inventory value - handle variants properly
    const totalInventoryValue = products.reduce((sum, p) => {
      if (p.variants && p.variants.length > 0) {
        // Sum up value of all variants (variant.price × variant.stock)
        const variantValue = p.variants.reduce((variantSum, variant) => {
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
