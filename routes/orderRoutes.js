// ==========================
// File: routes/orderRoutes.js
// Saheli Store – FINAL SAFE VERSION (No Conflicts + Stable)
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

// 🧾 Generate Receipt (Creates PDF + saves URL)
router.get("/receipt/:id", generateOrderReceipt);

// 🧾 Download Stored Receipt (From File System)
// ✅ Ye route param se pehle hi rehna chahiye
router.get("/receipt/download/:id", downloadReceipt);

// =======================================
// ✅ ADMIN ROUTES
// =======================================

// 📦 Get all orders (with pagination)
router.get("/", getOrders);

// 🔎 Filter orders by status
router.get("/status/:status", getOrdersByStatus);

// 🟠 Update order
router.put("/:id", updateOrder);

// 🔴 Delete order
router.delete("/:id", deleteOrder);

// 📄 Get single order by ID
// ✅ Ye hamesha SABSE LAST me hi rehna chahiye
router.get("/:id", getOrderById);

module.exports = router;
