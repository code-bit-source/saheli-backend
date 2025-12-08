// ==========================
// File: routes/orderRoutes.js
// Saheli Store – FINAL VERCEL + BUFFER SAFE VERSION ✅
// ==========================

const express = require("express");
const router = express.Router();

const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  generateOrderReceipt,
  downloadReceipt,
} = require("../controllers/orderController");

// =======================================
// ✅ USER ROUTES
// =======================================

// 🔵 Create new order
router.post("/", createOrder);

// 🧾 Download Receipt (BUFFER BASED – ✅ MUST COME FIRST)
router.get("/receipt/download/:id", downloadReceipt);

// 🧾 Generate Receipt (Creates PDF in DB BUFFER)
router.get("/receipt/:id", generateOrderReceipt);

// =======================================
// ✅ ADMIN ROUTES (Protect later with auth middleware)
// =======================================

// 📦 Get all orders (with pagination)
router.get("/", getOrders);

// 🔎 Filter orders by status
router.get("/status/:status", getOrdersByStatus);

// 🟠 Update order (Only status & payment allowed)
router.put("/:id", updateOrder);

// 🔴 Delete order (Soft delete recommended)
router.delete("/:id", deleteOrder);

// 📄 Get single order by ID (⚠️ ALWAYS LAST)
router.get("/:id", getOrderById);

module.exports = router;
