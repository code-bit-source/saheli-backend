// ==========================
// Saheli Store – Final Server (Local + Vercel Safe)
// ==========================

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "15mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// -------------------------
// Connect MongoDB
// -------------------------
connectDB();

// -------------------------
// Routes
// -------------------------
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// -------------------------
// Root API Info
// -------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🛍️ Saheli Store API Running Successfully",
    version: "3.0.0",
    env: process.env.NODE_ENV || "development",
    serverTime: new Date().toISOString(),
  });
});

// -------------------------
// 404 Handler
// -------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// -------------------------
// Global Error Handler
// -------------------------
app.use((err, req, res, next) => {
  console.error("❌ Global Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

module.exports = app;
