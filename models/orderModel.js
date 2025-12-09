// ==========================
// File: models/orderModel.js
// Saheli Store – FINAL VERCEL + PDF BUFFER SAFE VERSION ✅
// ==========================

const mongoose = require("mongoose");

// ==========================
// 🔹 ORDER SCHEMA
// ==========================
const orderSchema = new mongoose.Schema(
  {
    // 🧍 CUSTOMER INFO
    customer: {
      name: {
        type: String,
        required: [true, "Please add customer name"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Please add phone number"],
        match: [/^[6-9][0-9]{9}$/, "Enter valid Indian mobile number"],
        set: (val) => val.replace(/^0+/, ""),
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
      address: {
        line1: { type: String, required: true },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pincode: { type: String, default: "" },
      },
    },

    // 🛒 CART ITEMS
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId, // ✅ FIXED
          ref: "Product",
        },
        title: { type: String, trim: true },
        name: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1, default: 1 },
        image: { type: String, default: "" },
      },
    ],

    // 💰 PAYMENT INFO
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "online payment" ],
      default: "online payment",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },

    // 🚚 ORDER STATUS
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // 🧾 RECEIPT (✅ BUFFER BASED – VERCEL SAFE)
    receipt: {
      pdfBuffer: { type: Buffer, default: null },  
      createdAt: { type: Date, default: null },
    },

    // 🕒 TIMESTAMPS
    orderedAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },

    // 🔐 ADMIN META
    adminNotes: { type: String, trim: true, default: "" },
    trackingId: { type: String, trim: true, default: "" },

    // ⚙️ SYSTEM FIELDS
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==========================
// 🔹 VIRTUAL FIELDS
// ==========================

// ✅ Total quantity of all items
orderSchema.virtual("totalItems").get(function () {
  if (!Array.isArray(this.cartItems)) return 0;
  return this.cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);
});

// ✅ Auto Receipt Title
orderSchema.virtual("receiptTitle").get(function () {
  const safeName = this.customer?.name
    ? this.customer.name.replace(/\s+/g, "_")
    : "Customer";
  return `Order_${this._id}_${safeName}`;
});

// ==========================
// 🔹 MIDDLEWARE / HOOKS
// ==========================

// ✅ Auto-set deliveredAt on status change
orderSchema.pre("save", function (next) {
  if (this.isModified("orderStatus") && this.orderStatus === "Delivered") {
    this.deliveredAt = new Date();
  }
  next();
});

// ✅ Normalize cart items before save
orderSchema.pre("save", function (next) {
  if (Array.isArray(this.cartItems)) {
    this.cartItems = this.cartItems.map((item) => ({
      ...item,
      name: item.name || item.title || "Unnamed Product",
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    }));
  }
  next();
});

// ✅ Auto exclude soft-deleted items (FULL COVERAGE)
orderSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// ==========================
// 🔹 INDEXES (🔥 SPEED BOOST)
// ==========================
orderSchema.index({ "customer.phone": 1 });
orderSchema.index({ "customer.name": 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderedAt: -1 });

// ==========================
// 🔹 EXPORT MODEL
// ==========================
module.exports = mongoose.model("Order", orderSchema);
