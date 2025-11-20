// ==========================
// File: models/productModel.js
// Saheli Store – Product Schema (Optimized for Admin & Analytics)
// ==========================

const mongoose = require("mongoose");

// 🆔 Helper function for auto Product IDs
const generateProductId = () =>
  `PID-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

// ==========================
// 🔹 Product Schema
// ==========================
const productSchema = new mongoose.Schema(
  {
    // 🏷️ BASIC INFO
    productId: {
      type: String,
      default: generateProductId,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Please add a product title"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters long"],
    },
    category: {
      type: String,
      default: "Uncategorized",
      trim: true,
      lowercase: true,
      index: true, // ✅ faster admin search
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description too long"],
    },

    // 💰 PRICING & STOCK
    price: {
      type: Number,
      required: [true, "Please add product price"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      default: 10,
      min: [0, "Stock cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0, // percentage
      min: 0,
      max: 100,
    },

    // ⭐ PRODUCT FLAGS
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },

    // 🖼️ IMAGE HANDLING
    image: {
  type: String,
  trim: true,
  default: "https://via.placeholder.com/300x200.png?text=Saheli+Product",
  validate: {
    validator: function (v) {
      // Allow http, https, or base64 (data:image/)
      return /^https?:\/\//.test(v) || v.startsWith("data:image/");
    },
    message: "Image must be a valid URL or Base64 data URI",
  },
},

    // 📦 METADATA
    addedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// ==========================
// 🔹 VIRTUAL FIELDS
// ==========================

// 💵 Final price after discount
productSchema.virtual("finalPrice").get(function () {
  if (this.discount > 0) {
    const discounted = this.price - (this.price * this.discount) / 100;
    return Math.round(discounted * 100) / 100; // ✅ 2-decimal safe rounding
  }
  return this.price;
});

// ==========================
// 🔹 PRE-SAVE HOOKS
// ==========================
productSchema.pre("save", function (next) {
  // ✅ Ensure unique Product ID
  if (!this.productId) this.productId = generateProductId();

  // ✅ Auto-disable product if out of stock
  if (this.stock <= 0) this.isActive = false;

  next();
});

// ==========================
// 🔹 INDEXES (for faster queries)
// ==========================
productSchema.index({ title: "text", category: "text" }); // enable text search
productSchema.index({ bestSeller: 1 });
productSchema.index({ recommended: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });

// ==========================
// 🔹 EXPORT MODEL
// ==========================
module.exports = mongoose.model("Product", productSchema);
