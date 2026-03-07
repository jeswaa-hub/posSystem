const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: ["product", "ingredient"], default: "product" },
    recipe: [
      {
        ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true }, // How much of the ingredient is used
      }
    ],
    unit: { type: String, default: "pcs" },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "out_of_stock", "draft"], default: "active" },
    image: { type: String },
    images: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);