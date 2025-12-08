// ==========================
// File: controllers/productController.js
// Saheli Store – FINAL ✅ PRODUCTION + VERCEL SAFE VERSION
// ==========================

const Product = require("../models/productModel");

// 🧠 In-memory query-based cache
let productCache = new Map();
const CACHE_DURATION = 10000; // ✅ 10 seconds

// ---------------------------
// ✅ GET ALL PRODUCTS (CACHE + FILTER SAFE)
// ---------------------------
const getProducts = async (req, res) => {
  try {
    const cacheKey = JSON.stringify(req.query);
    const cached = productCache.get(cacheKey);

    if (cached && Date.now() - cached.time < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        count: cached.data.length,
        fromCache: true,
        products: cached.data,
      });
    }

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

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();

    productCache.set(cacheKey, { data: products, time: Date.now() });

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
// ✅ GET SINGLE PRODUCT
// ---------------------------
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
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
// ✅ CREATE PRODUCT (STRICT VALIDATION)
// ---------------------------
const createProduct = async (req, res) => {
  try {
    const data = req.body;

    const rawPrice = String(data.price).replace(/,/g, "");

    if (!data.title || rawPrice === undefined || isNaN(Number(rawPrice))) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid title & price",
      });
    }

    const newProduct = new Product({
      title: data.title.trim(),
      price: Number(rawPrice),
      stock: Number(data.stock) || 10,
      category: data.category?.trim() || "Uncategorized",
      description: data.description?.trim() || "",
      image:
        data.image && data.image.trim().length > 0
          ? data.image.trim()
          : "https://via.placeholder.com/300x200.png?text=Saheli+Product",
      recommended: !!data.recommended,
      bestSeller: !!data.bestSeller,
      discount: Math.max(0, Math.min(100, Number(data.discount) || 0)),
      rating: Math.max(0, Math.min(5, Number(data.rating) || 0)),
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "✅ Product added successfully!",
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
// ✅ UPDATE PRODUCT
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
    }).lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    productCache.clear();

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
// ✅ DELETE PRODUCT
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

    productCache.clear();

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
// ✅ TOGGLE HIGHLIGHT (OPTIMIZED)
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

    productCache.clear();

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
// ✅ EXPORT
// ==========================
module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHighlight,
};
