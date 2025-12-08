// ==========================
// Saheli Store – FINAL SERVER ✅ (Vercel + Localhost 100% SAFE)
// File Location: api/index.js
// ==========================

const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("../config/db");

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

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ===============================
// ✅ SECURITY + PERFORMANCE
// ===============================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

// ✅ Body parser
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ===============================
// ✅ ✅ ✅ SAFE MONGODB CONNECTION
// ===============================
let isDBConnected = false;

if (!isDBConnected) {
  connectDB();
  isDBConnected = true;
}

// ===============================
// ✅ API ROUTES (⚠️ IMPORTANT FIX HERE)
// ===============================
const productRoutes = require("../routes/productRoutes");
const orderRoutes = require("../routes/orderRoutes");

// ❌ OLD (galat):
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);

// ✅ NEW (100% Vercel Correct):
app.use("/products", productRoutes); // FINAL → /api/products
app.use("/orders", orderRoutes);     // FINAL → /api/orders

// ===============================
// ✅ ROOT ROUTE (HEALTH CHECK)
// ===============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Saheli Store API Root Working",
    server: "Vercel Node Server",
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// ✅ Optional Base API Test
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Saheli Store API Base Working",
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
    error:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.message,
  });
});

// ===============================
// ✅ ✅ ✅ FINAL EXPORT (FOR VERCEL SERVERLESS)
// ===============================
module.exports = app;
