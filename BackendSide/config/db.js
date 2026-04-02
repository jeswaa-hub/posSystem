const mongoose = require("mongoose");

const resolveMongoUri = () =>
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URI ||
  "mongodb+srv://jeswaa1810_db_user:joshua$1234!!!@pos.bqzj0pk.mongodb.net/pos"
  // "mongodb://localhost:27017/pos";

const connectDB = async () => {
  const mongoUri = resolveMongoUri();

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
