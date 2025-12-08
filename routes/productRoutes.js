// ==========================
// File: routes/productRoutes.js
// Saheli Store – FINAL ✅ OPTIMIZED PRODUCT ROUTES
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
// ✅ PUBLIC ROUTES
// =======================================

// 🟢 Get all products (filters, search, category, price range)
router.get("/", getProducts);

// 🟢 Get single product by ID (⚠️ Keep AFTER "/" route)
router.get("/:id", getProductById);

// =======================================
// ✅ ADMIN ROUTES
// =======================================

// 🟡 Create product
router.post("/", createProduct);

// 🟣 Toggle recommended / bestSeller (⚠️ Before PUT/DELETE for safety)
router.patch("/:id/toggle", toggleHighlight);

// 🟠 Update product
router.put("/:id", updateProduct);

// 🔴 Delete product
router.delete("/:id", deleteProduct);

module.exports = router;
