const mongoose = require("mongoose");

async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️  MONGO_URI is not set. Add it to server/.env — see .env.example.");
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
