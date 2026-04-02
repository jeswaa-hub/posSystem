const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    stockOnHand: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 }, // Stock committed to pending orders
    reorderPoint: { type: Number, default: 0, min: 0 },
    maxStock: { type: Number, default: 0, min: 0 },
    lastRestockedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);