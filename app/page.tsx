import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ProductGrid } from "@/components/product-grid"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/product"

async function getProducts() {
  try {
    await dbConnect()
    
    // Fetch products directly from database (more efficient than API call)
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
    
    return {
      products: products.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image: p.image,
        images: p.images,
        stock: p.stock,
        variants: p.variants,
      })),
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { products: [] }
  }
}

export default async function Home() {
  const { products } = await getProducts()

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Our Products</h1>
            <p className="text-muted-foreground mt-2">
              Discover our collection of quality products
            </p>
          </div>
          
          <ProductGrid products={products} />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
