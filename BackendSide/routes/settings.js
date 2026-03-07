const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// Get settings (Create default if none exists)
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

// Update settings
router.patch("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      settings[key] = updates[key];
    });

    await settings.save();
    req.app.get("io").emit("settings_updated", settings);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
