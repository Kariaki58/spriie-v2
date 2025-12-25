import mongoose, { Schema, model, models } from "mongoose"

const VisitorSchema = new Schema(
  {
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
      index: true,
    },
    // User agent (for device/browser info)
    userAgent: {
      type: String,
    },
    // Page path visited
    path: {
      type: String,
      required: true,
      index: true,
    },
    // Referrer (where visitor came from)
    referrer: {
      type: String,
    },
    // Country (optional, can be added later with geo IP)
    country: {
      type: String,
    },
    // Timestamp of visit
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

// Index for efficient queries on date ranges
VisitorSchema.index({ timestamp: -1 })
VisitorSchema.index({ visitorId: 1, timestamp: -1 })

export default models.Visitor || model("Visitor", VisitorSchema)
