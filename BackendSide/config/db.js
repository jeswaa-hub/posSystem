const mongoose = require("mongoose");

const resolveMongoUri = () =>
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URI ||
  "mongodb://pos:sLcu854HFMGonvEY1g3H@103.125.219.175:27018";

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
