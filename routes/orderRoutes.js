// ==========================
// File: routes/orderRoutes.js
// Saheli Store – Final Order Routes (Vercel + MongoDB Safe)
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
// USER ROUTES
// =======================================

// 🔵 Create new order
router.post("/", createOrder);

// 🧾 Generate Receipt (Memory PDF → MongoDB)
router.get("/receipt/:id", generateOrderReceipt);

// 🧾 Download Stored Receipt (MongoDB PDF → User Download)
router.get("/receipt/download/:id", downloadReceipt);

// =======================================
// ADMIN ROUTES
// =======================================

// 📦 Get all orders
router.get("/", getOrders);

// 🔎 Filter orders by status
router.get("/status/:status", getOrdersByStatus);

// 📄 Get single order
router.get("/:id", getOrderById);

// 🟠 Update order
router.put("/:id", updateOrder);

// 🔴 Delete order
router.delete("/:id", deleteOrder);

module.exports = router;
