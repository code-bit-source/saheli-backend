// ==========================
// File: routes/productRoutes.js
// Saheli Store – Final Optimized Product Routes
// ==========================

const express = require("express");
const router = express.Router();

// Controllers
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHighlight,
} = require("../controllers/productController");

// =======================================
// PUBLIC ROUTES
// =======================================

// 🟢 Get all products (With filters, search, category, price range)
router.get("/", getProducts);

// 🟢 Get single product (Cleaner route)
router.get("/:id", getProductById);
// ⚠️ NOTE: This must stay AFTER "/" listing route

// =======================================
// ADMIN ROUTES
// =======================================

// 🟡 Create product
router.post("/", createProduct);

// 🟠 Update product
router.put("/:id", updateProduct);

// 🔴 Delete product
router.delete("/:id", deleteProduct);

// 🟣 Toggle recommended/bestSeller
router.patch("/:id/toggle", toggleHighlight);

module.exports = router;
