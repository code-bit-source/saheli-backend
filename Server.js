// ==========================
// Saheli Store – FINAL SERVER (Optimized + Vercel Safe)
// ==========================

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

// -------------------------
// Security + Performance Middleware
// -------------------------

// CORS – allow all frontend origins including Vercel
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Helmet – disable some policies to avoid blocking React app on Vercel
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// GZIP Compression
app.use(compression());

// JSON Parser
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Morgan (logging)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// -------------------------
// Connect MongoDB
// -------------------------
connectDB();

// -------------------------
// API Routes
// -------------------------
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// -------------------------
// Root Route
// -------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🛍️ Saheli Store API Running Successfully",
    version: "3.0.1",
    server: "Vercel Node Server",
    environment: process.env.NODE_ENV || "development",
    serverTime: new Date().toISOString(),
  });
});

// -------------------------
// 404 Handler
// -------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found → ${req.originalUrl}`,
  });
});

// -------------------------
// Global Error Handler
// -------------------------
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// -------------------------
// Export for Vercel
// -------------------------
module.exports = app;
