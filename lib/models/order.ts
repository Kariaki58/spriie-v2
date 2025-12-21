import mongoose, { Schema, model, models } from "mongoose"

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: String,
  variantId: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // Optional because sometimes guest checkout might be allowed, 
      // though based on dummy data it seems we emulate customers as users
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    total: {
      type: Number,
      required: true,
    },
    items: [OrderItemSchema],
    shippingAddress: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Order = models.Order || model("Order", OrderSchema)

export default Order
