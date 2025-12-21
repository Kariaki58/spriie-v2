import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import ShippingRate from "@/lib/models/shipping-rate"

export async function GET() {
  try {
    await dbConnect()
    const rates = await ShippingRate.find({}).sort({ createdAt: -1 })
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error fetching rates:", error)
    return NextResponse.json({ error: "Failed to fetch shipping rates" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect()
    const body = await req.json()
    const { country, state, city, price, isGlobal } = body

    if ((!isGlobal && !country) || price === undefined) {
      return NextResponse.json({ error: "Country and price are required unless global" }, { status: 400 })
    }

    if (isGlobal) {
        // Upsert global rate
        const globalRate = await ShippingRate.findOneAndUpdate(
            { isGlobal: true },
            { price, isGlobal: true, country: "Global", state: null, city: null },
            { new: true, upsert: true }
        )
        return NextResponse.json(globalRate, { status: 201 })
    }

    const newRate = await ShippingRate.create({
      country,
      state,
      city,
      price,
    })

    return NextResponse.json(newRate, { status: 201 })
  } catch (error) {
     console.error("Error creating shipping rate:", error)
    return NextResponse.json({ error: "Failed to create shipping rate" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        await ShippingRate.findByIdAndDelete(id)
        return NextResponse.json({ message: "Shipping rate deleted" })
    } catch (error) {
        console.error("Error deleting rate:", error)
        return NextResponse.json({ error: "Failed to delete shipping rate" }, { status: 500 })
    }
}
