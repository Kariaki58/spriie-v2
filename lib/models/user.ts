import mongoose, { Schema, model, models } from "mongoose"

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      index: true,
    },
    password: {
      type: String,
      // Optional because some users might sign in via OAuth (future proofing) or just be customers created by admin
      select: false, 
    },
    role: {
      type: String,
      enum: ["customer", "owner", "admin", "manager", "staff"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    avatar: {
      type: String,
    },
    // For customers specifically
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

const User = models.User || model("User", UserSchema)

export default User
