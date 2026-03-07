const mongoose = require("mongoose");

const transactionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  costSubtotal: { type: Number, default: 0, min: 0 },
  profitSubtotal: { type: Number, default: 0 },
});

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, default: "Walk-in Customer" }, // Store direct name if no customer record
    items: [transactionItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    grossProfit: { type: Number, default: 0 },
    tax: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0 }, // Added to store the tax rate percentage
    discount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "gcash", "paymaya"], default: "cash" },
    status: { type: String, enum: ["pending", "completed", "cancelled", "refunded"], default: "pending" },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
