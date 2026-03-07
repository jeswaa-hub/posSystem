const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  appName: { type: String, default: "POS System" },
  appSubtitle: { type: String, default: "Admin Dashboard" },
  logoChar: { type: String, default: "S" },
  logoColorStart: { type: String, default: "#f59e0b" },
  logoColorEnd: { type: String, default: "#dc2626" },
  taxRate: { type: Number, default: 12 }, // Default 12%
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
