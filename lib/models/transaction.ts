import mongoose, { Schema, model, models } from "mongoose"

const TransactionSchema = new Schema(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["successful", "failed", "pending"],
      default: "pending",
    },
    description: {
      type: String,
    },
    reference: {
      type: String,
      unique: true,
    },
    senderOrReceiver: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

const Transaction = models.Transaction || model("Transaction", TransactionSchema)

export default Transaction
