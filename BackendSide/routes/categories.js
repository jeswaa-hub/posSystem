const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const { verifyToken, verifyTokenAndAdmin } = require("../middleware/authMiddleware");

// Public: Get all categories
router.get("/", verifyToken, async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: Get single category
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isActive: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager/Admin: Create Category
router.post("/", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to create categories!" });
  }

  try {
    const category = await Category.create(req.body);
    req.app.get("io").emit("category_created", category);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager/Admin: Update Category
router.patch("/:id", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to update categories!" });
  }

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    req.app.get("io").emit("category_updated", category);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manager/Admin: Delete Category
router.delete("/:id", verifyToken, async (req, res) => {
  // Allow Admin and Manager
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ message: "You are not allowed to delete categories!" });
  }

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
    if (!category) return res.status(404).json({ message: "Category not found" });
    req.app.get("io").emit("category_deleted", req.params.id);
    res.json({ message: "Category deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;