// ==========================
// Saheli Store – FINAL SERVER (Vercel + Localhost 100% Working)
// ==========================

const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
const app = express();

// ===============================
// ✅ ✅ ✅ FULL CORS FIX (VERCEL SAFE + PREFLIGHT SAFE)
// ===============================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // ✅ Preflight (OPTIONS) request ka instant response
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ===============================
// Security + Performance Middleware
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

// ✅ Body parser – routes se pehle hona zaroori hai
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ===============================
// ✅ RECEIPT STATIC FILE SUPPORT
// ===============================
app.use("/receipts", express.static(path.join(__dirname, "public/receipts")));

// ===============================
// ✅ CONNECT MONGODB
// ===============================
connectDB();

// ===============================
// ✅ API ROUTES
// ===============================
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ===============================
// ✅ ROOT ROUTE (HEALTH CHECK)
// ===============================
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

// ===============================
// ✅ 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found → ${req.originalUrl}`,
  });
});

// ===============================
// ✅ GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL SERVER ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ===============================
// ✅ ✅ ✅ VERCEL EXPORT (FINAL & IMPORTANT)
// ===============================
module.exports = app;
