import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/db"
import Settings from "@/lib/models/settings"
import cloudinary from "@/lib/cloudinary"

export async function GET() {
  try {
    // Public access: dashboard needs settings even before auth is ready
    await dbConnect()
    
    // Get or create settings
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create({})
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { storeName, domain, logo, backgroundColor, primaryColor, accentColor } = body

    await dbConnect()

    // Get or create settings
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create({
        storeName,
        domain,
        backgroundColor,
        primaryColor,
        accentColor,
      })
    }

    // Handle logo upload to Cloudinary if provided
    if (logo !== undefined) {
      // If logo is null/empty, optionally clean up existing logo
      if (!logo && settings.logoPublicId) {
        try {
          await cloudinary.uploader.destroy(settings.logoPublicId)
        } catch (err) {
          console.error("Failed to delete old logo from Cloudinary:", err)
        }
        settings.logo = null
        settings.logoPublicId = null
      } else if (logo && typeof logo === "string" && logo.startsWith("data:")) {
        // Upload new logo if it's a data URL
        const upload = await cloudinary.uploader.upload(logo, {
          folder: "spriie/settings",
          overwrite: true,
        })
        settings.logo = upload.secure_url
        settings.logoPublicId = upload.public_id
      } else if (logo && typeof logo === "string") {
        // If a regular URL was provided, store as-is
        settings.logo = logo
      }
    }

    // Update other settings
    if (storeName !== undefined) settings.storeName = storeName
    if (domain !== undefined) settings.domain = domain
    if (backgroundColor !== undefined) settings.backgroundColor = backgroundColor
    if (primaryColor !== undefined) settings.primaryColor = primaryColor
    if (accentColor !== undefined) settings.accentColor = accentColor

    await settings.save()

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    })
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
