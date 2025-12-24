import mongoose, { Schema, model, models } from "mongoose"

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  variant: {
    type: String, // JSON string of variant attributes [{name: "Size", value: "L"}]
  },
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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["flutterwave", "cash", "transfer"],
      default: "flutterwave",
    },
    paymentReference: {
      type: String,
    },
    flutterwaveReference: {
      type: String,
    },
    trackingId: {
      type: String,
      unique: true,
      sparse: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
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
    shippingDate: {
      type: Date,
    },
    shippingProvider: {
      type: String,
    },
    deliveryNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

const Order = models.Order || model("Order", OrderSchema)

export default Order
