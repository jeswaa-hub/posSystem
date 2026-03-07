const express = require("express");
const router = express.Router();
const { Category } = require("../models");

router.get("/", async (_req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isActive: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const category = await Category.create(req.body);
    req.app.get("io").emit("category_created", category);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    req.app.get("io").emit("category_updated", category);
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
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