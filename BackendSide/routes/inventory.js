const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Inventory, InventoryLog, Product } = require("../models");

// Get all inventory records with product details
router.get("/", async (_req, res) => {
  try {
    // Also fetch product details like price/cost for valuation
    const inventories = await Inventory.find().populate("product", "name sku price cost category type unit");
    res.json(inventories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inventory logs
router.get("/logs", async (req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate("product", "name sku price cost category type unit");
    if (!inventory) return res.status(404).json({ message: "Inventory record not found" });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize inventory for a product
router.post("/", async (req, res) => {
  try {
    const { product, stockOnHand, reorderPoint, maxStock, notes } = req.body;
    
    // Check if inventory exists, but populate product to return full data if it does
    let inventory = await Inventory.findOne({ product }).populate("product", "name sku price cost category type unit");
    
    if (inventory) {
      // If it exists, we can just return it (idempotent) or update it.
      // Update fields if provided
      if (stockOnHand !== undefined) inventory.stockOnHand = stockOnHand;
      if (reorderPoint !== undefined) inventory.reorderPoint = reorderPoint;
      if (maxStock !== undefined) inventory.maxStock = maxStock;
      if (notes !== undefined) inventory.notes = notes;
      
      await inventory.save();
      
      // Sync Product model's simple stock field if needed
      if (stockOnHand !== undefined) {
         await Product.findByIdAndUpdate(product, { stock: stockOnHand });
      }

      return res.status(200).json(inventory);
    }
    
    // Create inventory record
    inventory = await Inventory.create({ product, stockOnHand, reorderPoint, maxStock, notes });
    
    // Sync with Product model's simple stock field if needed
    await Product.findByIdAndUpdate(product, { stock: stockOnHand });

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      const populatedInventory = await Inventory.findById(inventory._id).populate("product", "name sku price cost category type unit");
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
router.post("/adjust", async (req, res) => {
  try {
    const { productId, adjustmentQty, type, reason, userId, notes } = req.body;
    
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
      user: userId, // In real app, get from req.user._id
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
      io.emit("inventory_updated", { productId, newStock: newQty });
      io.emit("product_updated", { _id: productId, stock: newQty }); // Keep POS in sync
    }

    res.json({ message: "Stock adjusted successfully", newStock: newQty });
  } catch (err) {
    console.error("Stock Adjustment Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!inventory) return res.status(404).json({ message: "Inventory record not found" });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
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
