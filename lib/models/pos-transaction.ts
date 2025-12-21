import mongoose, { Schema, model, models } from "mongoose"

const POSCartItemSchema = new Schema({
  productId: String,
  productName: String,
  price: Number,
  quantity: Number,
  variant: String,
})

const POSTransactionSchema = new Schema(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [POSCartItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    qrCode: {
      type: String,
    },
    cardDetails: {
      cardNumber: String,
      cardName: String,
      expiryDate: String,
      cvv: String,
    },
    paidAt: {
      type: Date,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
)

const POSTransaction = models.POSTransaction || model("POSTransaction", POSTransactionSchema)

export default POSTransaction
