import mongoose from "mongoose"

const shippingRateSchema = new mongoose.Schema({
  country: {
    type: String,
    required: false,
  },
  isGlobal: {
    type: Boolean,
    default: false,
  },
  state: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.ShippingRate || mongoose.model("ShippingRate", shippingRateSchema)
