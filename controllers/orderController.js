// ==========================
// File: controllers/orderController.js
// Saheli Store – FINAL ✅ VERCEL + PRODUCTION SAFE VERSION
// ==========================

const Order = require("../models/orderModel");
const PDFDocument = require("pdfkit");

// ===============================
// ✅ GET ALL ORDERS (PAGINATION)
// ===============================
const getOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-receipt")
      .lean();

    const total = await Order.countDocuments({ isDeleted: { $ne: true } });

    res.status(200).json({
      success: true,
      total,
      page,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ===============================
// ✅ GET SINGLE ORDER
// ===============================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    })
      .select("-receipt")
      .lean();

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// ===============================
// ✅ CREATE ORDER
// ===============================
const createOrder = async (req, res) => {
  try {
    const { customer, cartItems, items, totalPrice, paymentMethod } = req.body;

    const finalItems = cartItems || items;
    const address = customer?.address || customer;

    if (
      !customer?.name ||
      !customer?.phone ||
      !address?.line1 ||
      !Array.isArray(finalItems) ||
      finalItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing customer details or cart items",
      });
    }

    const newOrder = new Order({
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: {
          line1: address.line1,
          city: address.city || "",
          state: address.state || "",
          pincode: address.pincode || "",
        },
      },
      cartItems: finalItems,
      totalPrice,
      paymentMethod: paymentMethod || "Cash on Delivery",
      orderStatus: "Pending",
      paymentStatus: "Pending",
      isDeleted: false,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// ===============================
// ✅ UPDATE ORDER (BUG FIXED)
// ===============================
const updateOrder = async (req, res) => {
  try {
    const allowed = ["orderStatus", "paymentStatus", "paymentMethod"]; // ✅ FIX
    const updates = {};

    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      updates,
      { new: true }
    ).select("-receipt");

    if (!updatedOrder)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};


// ===============================
// ✅ DELETE ORDER (SOFT DELETE SAFE)
// ===============================
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully (soft)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

// ===============================
// ✅ GET BY STATUS
// ===============================
const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: req.params.status,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-receipt")
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch filtered orders",
      error: error.message,
    });
  }
};

// ===============================
// ✅ GENERATE RECEIPT (BUFFER – VERCEL SAFE)
// ===============================
const generateOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    const doc = new PDFDocument({ margin: 40 });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);
      order.receipt = { pdfBuffer: pdfData, createdAt: new Date() };
      await order.save();

      res.status(200).json({
        success: true,
        message: "Receipt generated successfully",
      });
    });

    const items = Array.isArray(order.cartItems) ? order.cartItems : [];

    doc.fontSize(22).text("Saheli Store", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Order Receipt", { align: "center" });
    doc.moveDown(2);

    doc.text(`Customer: ${order.customer.name}`);
    doc.text(`Phone: ${order.customer.phone}`);

    const a = order.customer.address;
    doc.text(`Address: ${a.line1}, ${a.city}, ${a.state} - ${a.pincode}`);

    doc.moveDown();
    doc.text("Items:", { underline: true });

    items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.title} (x${item.qty}) — ₹${item.price * item.qty}`
      );
    });

    doc.moveDown();
    doc.text(`Total Price: ₹${order.totalPrice}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Status: ${order.orderStatus}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);

    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate receipt",
      error: error.message,
    });
  }
};

// ===============================
// ✅ DOWNLOAD RECEIPT
// ===============================
const downloadReceipt = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true },
    });

    if (!order?.receipt?.pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Receipt_${order._id}.pdf`,
    });

    res.send(order.receipt.pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to download receipt",
      error: error.message,
    });
  }
};

// ===============================
// ✅ EXPORT
// ===============================
module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  generateOrderReceipt,
  downloadReceipt,
};
