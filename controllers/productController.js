// ==========================
// File: controllers/productController.js
// Saheli Store – Final Optimized Product Controller
// (Ultra-Fast + Safe for Vercel + Clean Code)
// ==========================

const Product = require("../models/productModel");

// 🧠 In-memory cache
let productCache = [];
let cacheTime = 0;
const CACHE_DURATION = 1000; // 10 seconds

// ---------------------------
// 🟢 GET ALL PRODUCTS (Public + Admin)
// ---------------------------
const getProducts = async (req, res) => {
  try {
    const now = Date.now();

    // 🍀 Serve from cache
    if (productCache.length && now - cacheTime < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        count: productCache.length,
        fromCache: true,
        products: productCache,
      });
    }

    // -------- APPLY FILTERS --------
    const { category, minPrice, maxPrice, search, bestSeller, recommended } =
      req.query;

    const query = {};

    if (category) query.category = { $regex: category, $options: "i" };
    if (bestSeller) query.bestSeller = bestSeller === "true";
    if (recommended) query.recommended = recommended === "true";

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ⚡ Fast query with lean()
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Save cache
    productCache = products;
    cacheTime = Date.now();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// ---------------------------
// 🔵 GET SINGLE PRODUCT
// ---------------------------
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// ---------------------------
// 🟡 CREATE PRODUCT
// ---------------------------
const createProduct = async (req, res) => {
  try {
    const data = req.body;

    if (!data.title || data.price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide title & price",
      });
    }

    const newProduct = new Product({
      title: data.title.trim(),
      price: Number(data.price),
      stock: data.stock || 10,
      category: data.category?.trim() || "Uncategorized",
      description: data.description?.trim() || "",
      image:
        data.image ||
        "https://via.placeholder.com/300x200.png?text=Saheli+Product",
      recommended: !!data.recommended,
      bestSeller: !!data.bestSeller,
      discount: Math.max(0, Math.min(100, Number(data.discount) || 0)),
      rating: Math.max(0, Math.min(5, Number(data.rating) || 0)),
    });

    const savedProduct = await newProduct.save();

    // 🚮 Invalidate Cache
    productCache = [];
    cacheTime = 0;

    return res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product: savedProduct,
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ---------------------------
// 🟠 UPDATE PRODUCT
// ---------------------------
const updateProduct = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.discount !== undefined)
      updates.discount = Math.max(
        0,
        Math.min(100, Number(updates.discount))
      );

    if (updates.rating !== undefined)
      updates.rating = Math.max(0, Math.min(5, Number(updates.rating)));

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Clear cache
    productCache = [];
    cacheTime = 0;

    return res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product: updated,
    });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ---------------------------
// 🔴 DELETE PRODUCT
// ---------------------------
const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Clear cache
    productCache = [];
    cacheTime = 0;

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// ---------------------------
// 🟣 Toggle Highlight (recommended / bestSeller)
// ---------------------------
const toggleHighlight = async (req, res) => {
  try {
    const { field } = req.body;

    if (!["recommended", "bestSeller"].includes(field)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field!",
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    product[field] = !product[field];
    await product.save();

    // Clear cache
    productCache = [];
    cacheTime = 0;

    return res.status(200).json({
      success: true,
      message: `${field} toggled successfully!`,
      product,
    });
  } catch (error) {
    console.error("❌ Error toggling flag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle",
      error: error.message,
    });
  }
};

// ==========================
// EXPORT
// ==========================
module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHighlight,
};
