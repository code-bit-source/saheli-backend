// ==========================
// File: controllers/orderController.js
// Saheli Store – FULL OPTIMIZED VERSION (FAST + SAFE + ALL FEATURES)
// ==========================

const Order = require("../models/orderModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// ===============================
// GET ALL ORDERS (PAGINATION + FAST)
// ===============================
const getOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-receipt.pdf") // ✅ heavy buffer skip
      .lean();

    const total = await Order.countDocuments();

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
// GET SINGLE ORDER (FAST)
// ===============================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("-receipt.pdf")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

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
// CREATE ORDER (SAFE)
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
      receipt: null,
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
// UPDATE ORDER
// ===============================
const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-receipt.pdf");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

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
// DELETE ORDER
// ===============================
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
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
// GET BY STATUS (WITH LIMIT)
// ===============================
const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: req.params.status,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-receipt.pdf")
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
// GENERATE RECEIPT (FILE + URL)
// ===============================
const generateOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const receiptsDir = path.join(__dirname, "../public/receipts");
    if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

    const filePath = path.join(receiptsDir, `Receipt_${order._id}.pdf`);
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(22).text("Saheli Store", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Order Receipt", { align: "center" });
    doc.moveDown(2);

    doc.text(`Customer: ${order.customer.name}`);
    doc.text(`Phone: ${order.customer.phone}`);

    if (order.customer.address) {
      const a = order.customer.address;
      doc.text(`Address: ${a.line1}, ${a.city}, ${a.state} - ${a.pincode}`);
    }

    doc.moveDown();
    doc.text("Items:", { underline: true });

    order.cartItems.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.title} (x${item.qty}) — ₹${item.price * item.qty}`);
    });

    doc.moveDown();
    doc.text(`Total Price: ₹${order.totalPrice}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Status: ${order.orderStatus}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);

    doc.end();

    stream.on("finish", async () => {
      order.receipt = {
        pdfUrl: `/receipts/Receipt_${order._id}.pdf`,
        createdAt: new Date(),
      };

      await order.save();

      res.status(200).json({
        success: true,
        message: "Receipt generated successfully",
        pdfUrl: order.receipt.pdfUrl,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate receipt",
      error: error.message,
    });
  }
};

// ===============================
// DOWNLOAD RECEIPT (FROM FILE)
// ===============================
const downloadReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order?.receipt?.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const filePath = path.join(__dirname, "../public", order.receipt.pdfUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file missing",
      });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to download receipt",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT
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
