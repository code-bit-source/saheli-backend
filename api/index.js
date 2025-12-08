// ==========================
// Saheli Store – FINAL SERVER ✅
// File Location: api/index.js
// Works on: Vercel + Localhost
// ==========================

const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const connectDB = require("../config/db");
const serverless = require("serverless-http"); // ✅ Wrapper for Vercel

dotenv.config();
const app = express();

// ===============================
// ✅ CORS SETUP (VERCEL SAFE)
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
// ✅ API ROUTES (NO EXTRA /api HERE ❗)
// ===============================
const productRoutes = require("../routes/productRoutes.js");
const orderRoutes = require("../routes/orderRoutes.js");

app.use("/products", productRoutes); // Final URL → /api/products
app.use("/orders", orderRoutes);     // Final URL → /api/orders

// ===============================
// ✅ ROOT ROUTE (OPTIONAL HEALTH CHECK)
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
module.exports = serverless(app);
