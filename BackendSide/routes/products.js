const express = require("express");
const router = express.Router();
const { Product, Inventory } = require("../models");
const { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("../middleware/authMiddleware");

// Public: Get all products (Used by POS and Admin)
router.get("/", verifyToken, async (_req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate("category", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: Get single product
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager/Admin/Cashier: Create Product
router.post("/", verifyToken, async (req, res) => {
  console.log("Create Product Request from User:", req.user.id, "Role:", req.user.role);
  
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

// Manager/Admin/Cashier: Update Product
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // Sync Inventory if stock is provided
    if (req.body.stock !== undefined) {
      await Inventory.findOneAndUpdate({ product: product._id }, { stockOnHand: req.body.stock });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("product_updated", product);
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager/Admin: Delete Product (Soft delete)
router.delete("/:id", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to delete products!" });
  }

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const io = req.app.get("io");
    if (io) {
      io.emit("product_deleted", { _id: req.params.id });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;