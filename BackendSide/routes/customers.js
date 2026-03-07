const express = require("express");
const router = express.Router();
const { Customer } = require("../models");

router.get("/", async (_req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isActive: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    req.app.get("io").emit("customer_created", customer);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    req.app.get("io").emit("customer_updated", customer);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    req.app.get("io").emit("customer_deleted", req.params.id);
    res.json({ message: "Customer deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;