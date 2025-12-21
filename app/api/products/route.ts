import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Product from "@/lib/models/product"
import cloudinary from "@/lib/cloudinary"


export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const availableForPOS = searchParams.get("availableForPOS") === "true"

    // Build query
    const query: any = {}

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ]
    }

    // Category filter
    if (category) {
      query.category = category
    }

    // POS availability filter - only filter if explicitly requested
    // If availableForPOS is true, show products where it's true or not set (default to available)
    if (availableForPOS) {
      // Combine with existing $or if search is also used
      if (query.$or) {
        // If search exists, we need to use $and to combine both conditions
        const searchCondition = { $or: query.$or }
        query.$and = [
          searchCondition,
          {
            $or: [
              { availableForPOS: true },
              { availableForPOS: { $exists: false } },
            ],
          },
        ]
        delete query.$or
      } else {
        query.$or = [
          { availableForPOS: true },
          { availableForPOS: { $exists: false } },
        ]
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await Product.countDocuments(query)

    // Get unique categories for filter
    const categories = await Product.distinct("category")

    // Return both formats for backward compatibility
    // products-table expects 'products', POS interface expects 'data'
    return NextResponse.json({
      success: true,
      products: products, // For backward compatibility with products-table
      data: products, // For POS interface with pagination
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categories,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, price, category, stock, images, variants } = body

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Upload images to Cloudinary
    const uploadedImages: string[] = []
    if (images && Array.isArray(images)) {
      // Process uploads in parallel
      const uploadPromises = images.map(async (image: string) => {
        const result = await cloudinary.uploader.upload(image, {
          folder: "spriie/products",
        })
        return result.secure_url
      })
      
      const results = await Promise.all(uploadPromises)
      uploadedImages.push(...results)
    }

    const newProduct = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      // Use the first image as the main image for backward compatibility
      image: uploadedImages.length > 0 ? uploadedImages[0] : "",
      images: uploadedImages,
      variants,
    })

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
