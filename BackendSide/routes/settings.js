const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { verifyToken, verifyTokenAndAdmin } = require("../middleware/authMiddleware");

// Get settings (Create default if none exists) - Public/Authenticated read
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings - Admin only
router.patch("/", verifyTokenAndAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const updates = req.body;
    const allowedUpdates = ["appName", "appSubtitle", "logoChar", "logoColorStart", "logoColorEnd", "taxRate"];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        settings[key] = updates[key];
      }
    });

    await settings.save();
    req.app.get("io").emit("settings_updated", settings);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
