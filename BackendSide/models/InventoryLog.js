const mongoose = require("mongoose");

const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["restock", "sale", "spoilage", "adjustment", "return", "manual_set", "initial"],
      required: true,
    },
    reason: { type: String, trim: true },
    oldQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    quantityChanged: { type: Number, required: true }, // Positive for add, negative for deduct
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryLog", inventoryLogSchema);
