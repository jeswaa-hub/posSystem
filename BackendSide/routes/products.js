const express = require("express");
const router = express.Router();
const { Product, Inventory } = require("../models");

router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate("category", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // Only automatically create inventory for 'product' type, not ingredients
    // Ingredients will be handled by POST /inventory explicitly in frontend
    if (req.body.type !== 'ingredient') {
      const inventory = await Inventory.findOneAndUpdate(
        { product: product._id },
        { 
          $setOnInsert: { 
            product: product._id,
            stockOnHand: req.body.stock || 0,
            reorderPoint: 5,
            maxStock: 100,
            notes: "Initial record" 
          } 
        },
        { upsert: true, new: true, runValidators: true }
      );

      // Emit inventory creation event too
      const populatedInventory = await Inventory.findById(inventory._id).populate("product", "name sku price cost category");
      req.app.get("io").emit("inventory_created", populatedInventory);
    }

    req.app.get("io").emit("product_created", product);
    res.status(201).json(product);
  } catch (err) {
    console.error("Product Creation Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    req.app.get("io").emit("product_updated", product);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ message: "Product not found" });
    req.app.get("io").emit("product_deleted", req.params.id);
    res.json({ message: "Product deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;