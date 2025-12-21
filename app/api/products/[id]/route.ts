import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/product"
import cloudinary from "@/lib/cloudinary"

// GET a single product by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await dbConnect()
    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, product }, { status: 200 })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// UPDATE a product by ID
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { name, description, price, category, stock, images, variants, existingImages } = body

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if product exists
    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Upload new images to Cloudinary
    const uploadedImages: string[] = [...(existingImages || [])]
    if (images && Array.isArray(images) && images.length > 0) {
      // Process uploads in parallel
      const uploadPromises = images.map(async (image: string) => {
        // Only upload if it's a base64 string (new image)
        if (image.startsWith('data:image')) {
          const result = await cloudinary.uploader.upload(image, {
            folder: "spriie/products",
          })
          return result.secure_url
        }
        return image // Return existing image URL
      })
      
      const results = await Promise.all(uploadPromises)
      uploadedImages.push(...results.filter(url => !existingImages?.includes(url)))
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        stock,
        image: uploadedImages.length > 0 ? uploadedImages[0] : "",
        images: uploadedImages,
        variants,
      },
      { new: true, runValidators: true }
    )

    return NextResponse.json(
      { success: true, product: updatedProduct },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// DELETE a product by ID
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await dbConnect()

    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Optional: Delete images from Cloudinary
    // if (product.images && product.images.length > 0) {
    //   for (const imageUrl of product.images) {
    //     const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0]
    //     await cloudinary.uploader.destroy(publicId)
    //   }
    // }

    await Product.findByIdAndDelete(id)

    return NextResponse.json(
      { success: true, message: "Product deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
