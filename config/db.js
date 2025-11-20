const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // ❗ IMPORTANT: Never exit in Vercel serverless
    throw new Error("MongoDB connection failed: " + error.message);
  }
};

module.exports = connectDB;
