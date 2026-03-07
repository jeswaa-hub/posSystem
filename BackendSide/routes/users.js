const express = require("express");
const router = express.Router();
const { User } = require("../models");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, permissions } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already exists" });
    const user = await User.create({ fullName, email, password, role, permissions });
    const userObj = user.toObject();
    delete userObj.password;
    req.app.get("io").emit("user_created", userObj);
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isActive: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { fullName, email, role, isActive, password, permissions } = req.body;
    
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Find user first to trigger pre-save hooks if password is changed
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();
    
    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    // Safer IO emission
    const io = req.app.get("io");
    if (io) io.emit("user_updated", updatedUser);
    
    res.json(updatedUser);
  } catch (err) {
    console.error("Backend User Update Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ message: "User not found" });
    req.app.get("io").emit("user_deleted", req.params.id);
    res.json({ message: "User deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;