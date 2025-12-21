import mongoose, { Schema, model, models } from "mongoose"

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    available: {
      type: Number,
      default: 0,
    },
    ledger: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  {
    timestamps: true,
  }
)

const Wallet = models.Wallet || model("Wallet", WalletSchema)

export default Wallet
