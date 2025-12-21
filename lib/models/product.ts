import mongoose, { Schema, model, models } from "mongoose"

const VariantSchema = new Schema({
  attributes: [{
    name: String,
    value: String
  }],
  stock: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  sku: {
    type: String,
  },
})

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a product name"],
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    variants: [VariantSchema],
    availableForPOS: {
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
)

const Product = models.Product || model("Product", ProductSchema)

export default Product
