const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Inventory, InventoryLog, Product } = require("../models");
const { verifyToken, verifyTokenAndAdmin } = require("../middleware/authMiddleware");

// Get all inventory records with product details
router.get("/", verifyToken, async (_req, res) => {
  try {
    // Also fetch product details like price/cost for valuation
    const inventories = await Inventory.find().populate("product", "name sku price cost category type unit");
    res.json(inventories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inventory logs
router.get("/logs", verifyToken, async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate("product", "name sku")
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate("product", "name sku price cost category type unit");
    if (!inventory) return res.status(404).json({ message: "Inventory record not found" });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize inventory for a product
router.post("/", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to initialize inventory!" });
  }

  try {
    const { product, stockOnHand, reorderPoint, maxStock, notes } = req.body;
    
    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) return res.status(404).json({ message: "Product not found" });

    // Check if inventory record already exists
    const existing = await Inventory.findOne({ product });
    if (existing) {
      // If it exists, update it? Or return existing?
      // Let's update stock if provided, or just return existing
      return res.status(200).json(existing);
    }

    const inventory = await Inventory.create({
      product,
      stockOnHand: stockOnHand || 0,
      reorderPoint: reorderPoint || 10,
      maxStock: maxStock || 1000,
      notes
    });

    // Create Initial Log
    await InventoryLog.create({
      product,
      user: req.user.id, // Use ID from token
      type: 'initial',
      reason: 'Initial Stock',
      oldQuantity: 0,
      newQuantity: stockOnHand || 0,
      quantityChanged: stockOnHand || 0,
      notes: "Initialized"
    });

    // Sync Product model stock
    await Product.findByIdAndUpdate(product, { stock: stockOnHand || 0 });

    const io = req.app.get("io");
    if (io) {
      const populatedInventory = await Inventory.findById(inventory._id).populate("product", "name sku price cost category");
      io.emit("inventory_created", populatedInventory);
    }

    // Return populated inventory so frontend can display it immediately
    const result = await Inventory.findById(inventory._id).populate("product", "name sku price cost category type unit");
    res.status(201).json(result);
  } catch (err) {
    console.error("Inventory Create Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Adjust stock (Admin/Manager only) - Removed Transaction for Standalone Support
router.post("/adjust", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to adjust stock!" });
  }

  try {
    const { productId, adjustmentQty, type, reason, notes } = req.body;
    // Note: userId is taken from req.user now for security
    
    // Find inventory
    let inventory = await Inventory.findOne({ product: productId });
    
    // If no inventory record exists, create one
    if (!inventory) {
      inventory = new Inventory({ product: productId, stockOnHand: 0 });
    }

    const oldQty = inventory.stockOnHand;
    let newQty = oldQty;
    let qtyChanged = 0;

    if (type === 'set') {
      newQty = Number(adjustmentQty);
      qtyChanged = newQty - oldQty;
    } else {
      // delta
      qtyChanged = Number(adjustmentQty);
      newQty = oldQty + qtyChanged;
    }

    if (newQty < 0) {
      throw new Error("Resulting stock cannot be negative");
    }

    inventory.stockOnHand = newQty;
    if (qtyChanged > 0) {
      inventory.lastRestockedAt = new Date();
    }
    await inventory.save();

    // Sync Product model stock
    await Product.findByIdAndUpdate(productId, { stock: newQty });

    // Create Log
    await InventoryLog.create({
      product: productId,
      user: req.user.id, // Use secure user ID from token
      type: type === 'set' ? 'manual_set' : (qtyChanged > 0 ? 'restock' : 'adjustment'), 
      // Mapping 'adjustment' generically, but could be specific like 'spoilage' if provided in body
      reason: reason || "Manual Adjustment",
      oldQuantity: oldQty,
      newQuantity: newQty,
      quantityChanged: qtyChanged,
      notes
    });
    
    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      const populatedInventory = await Inventory.findOne({ product: productId }).populate("product", "name sku price cost category type unit");
      io.emit("inventory_updated", populatedInventory);
      
      const fullProduct = await Product.findById(productId);
      if (fullProduct) {
        io.emit("product_updated", fullProduct);
      }
    }

    res.json({ message: "Stock adjusted successfully", newStock: newQty });
  } catch (err) {
    console.error("Stock Adjustment Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to update inventory!" });
  }

  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true })
      .populate("product", "name sku price cost category type unit");
    if (!inventory) return res.status(404).json({ message: "Inventory record not found" });
    
    // Emit real-time event
    const io = req.app.get("io");
    if (io) io.emit("inventory_updated", inventory);

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) return res.status(404).json({ message: "Inventory record not found" });
    
    // Emit real-time event
    const io = req.app.get("io");
    if (io) io.emit("inventory_deleted", req.params.id);

    res.json({ message: "Inventory record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
