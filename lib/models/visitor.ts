import mongoose, { Schema, model, models } from "mongoose"

const VisitorSchema = new Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    ipHash: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: String,
    path: {
      type: String,
      required: true,
      index: true,
    },
    referrer: String,
    country: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastActive: {  // NEW: Track last activity for online status
      type: Date,
      default: Date.now,
      index: true,
    },
    sessionId: {   // NEW: Better session tracking
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Optimized indexes
VisitorSchema.index({ timestamp: -1 })
VisitorSchema.index({ visitorId: 1, timestamp: -1 })
VisitorSchema.index({ lastActive: -1 })  // For active users query
VisitorSchema.index({ sessionId: 1 })    // For session-based queries

export default models.Visitor || model("Visitor", VisitorSchema)