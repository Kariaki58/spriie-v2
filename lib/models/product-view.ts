import mongoose, { Schema, model, models } from "mongoose"

const ProductViewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    // Create a unique identifier from IP + User-Agent (hash) to identify unique visitors
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    // IP address (hashed for privacy)
    ipHash: {
      type: String,
      required: true,
    },
    // User agent (for device/browser info)
    userAgent: {
      type: String,
    },
    // Timestamp of view
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
ProductViewSchema.index({ productId: 1, timestamp: -1 })
ProductViewSchema.index({ visitorId: 1, timestamp: -1 })
ProductViewSchema.index({ timestamp: -1 })

export default models.ProductView || model("ProductView", ProductViewSchema)
