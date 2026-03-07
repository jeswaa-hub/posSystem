const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const connectDB = require("./config/db");

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@pos.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("⚠️ Admin user already exists");
      process.exit(0);
    }

    const adminUser = new User({
      fullName: "System Admin",
      email: adminEmail,
      password: "admin123", // Will be hashed by pre-save hook
      role: "admin",
      isActive: true,
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log("   Email: admin@pos.com");
    console.log("   Password: admin123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();