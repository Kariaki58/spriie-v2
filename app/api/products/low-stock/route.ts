import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/product"

export async function GET() {
  try {
    await dbConnect()
    const products = await Product.find().lean()

    const lowStockItems: Array<{
      productId: string
      productName: string
      productImage?: string
      hasVariants: boolean
      items: Array<{
        variantId?: string
        variantAttributes?: Array<{ name: string; value: string }>
        stock: number
        price: number
        sku?: string
      }>
    }> = []

    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        // Product has variants - check each variant
        const lowStockVariants = product.variants
          .map((variant, index) => ({
            variantId: `${product._id}-${index}`,
            variantAttributes: variant.attributes || [],
            stock: variant.stock || 0,
            price: variant.price || product.price,
            sku: variant.sku,
          }))
          .filter((variant) => variant.stock < 20)

        if (lowStockVariants.length > 0) {
          lowStockItems.push({
            productId: product._id.toString(),
            productName: product.name,
            productImage: product.image,
            hasVariants: true,
            items: lowStockVariants,
          })
        }
      } else {
        // Product doesn't have variants - check product stock
        if ((product.stock || 0) < 20) {
          lowStockItems.push({
            productId: product._id.toString(),
            productName: product.name,
            productImage: product.image,
            hasVariants: false,
            items: [
              {
                stock: product.stock || 0,
                price: product.price,
              },
            ],
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: lowStockItems,
    })
  } catch (error) {
    console.error("Error fetching low stock items:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
