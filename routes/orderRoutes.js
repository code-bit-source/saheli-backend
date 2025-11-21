// ==========================
// File: routes/orderRoutes.js
// Saheli Store – FINAL FIXED VERSION (No Route Conflicts)
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

// 🧾 Generate Receipt (Creates + Returns pdfUrl)
router.get("/receipt/:id", generateOrderReceipt);

// 🧾 Download Stored Receipt (PDF Buffer → Browser)
// 🚫 MUST COME BEFORE "/:id" (Otherwise conflict)
router.get("/receipt/download/:id", downloadReceipt);

// =======================================
// ADMIN ROUTES
// =======================================

// 📦 Get all orders
router.get("/", getOrders);

// 🔎 Filter orders by status
router.get("/status/:status", getOrdersByStatus);

// 📄 Get single order
// ⚠ MUST BE AT BOTTOM (Catch-all param route)
router.get("/:id", getOrderById);

// 🟠 Update order
router.put("/:id", updateOrder);

// 🔴 Delete order
router.delete("/:id", deleteOrder);

module.exports = router;
