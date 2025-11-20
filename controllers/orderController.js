// ==========================
// File: controllers/orderController.js
// Saheli Store – FINAL Vercel-Safe Controller (PDF in MongoDB)
// ==========================

const Order = require("../models/orderModel");
const PDFDocument = require("pdfkit");

// ---------------------------
// 🟢 GET ALL ORDERS
// ---------------------------
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
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

// ---------------------------
// 🔵 GET SINGLE ORDER
// ---------------------------
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
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

// ---------------------------
// 🟡 CREATE ORDER
// ---------------------------
const createOrder = async (req, res) => {
  try {
    const { customer, cartItems, items, totalPrice, paymentMethod } = req.body;
    const finalItems = cartItems || items;
    const address = customer?.address || customer;

    if (!customer?.name || !customer?.phone || !address?.line1 || !Array.isArray(finalItems) || finalItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required customer or order details",
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

// ---------------------------
// 🟠 UPDATE ORDER
// ---------------------------
const updateOrder = async (req, res) => {
  try {
    const updates = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updates, { new: true });

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

// ---------------------------
// 🔴 DELETE ORDER
// ---------------------------
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

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

// ---------------------------
// 📊 GET ORDERS BY STATUS
// ---------------------------
const getOrdersByStatus = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: req.params.status })
      .sort({ createdAt: -1 })
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

// ---------------------------
// 🧾 GENERATE RECEIPT (PDF → MongoDB)
// ---------------------------
const generateOrderReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    // PDF in memory
    const doc = new PDFDocument({ margin: 40 });
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Save PDF in MongoDB
      order.receipt = {
        pdf: pdfBuffer,
        createdAt: new Date(),
      };

      await order.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=Receipt_${order._id}.pdf`
      );

      res.send(pdfBuffer);
    });

    // PDF Content
    doc.fontSize(22).text("🛍️ Saheli Store", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Order Receipt", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Customer: ${order.customer.name}`);
    doc.text(`Phone: ${order.customer.phone}`);

    if (order.customer.address) {
      const a = order.customer.address;
      doc.text(`Address: ${a.line1}, ${a.city}, ${a.state} - ${a.pincode}`);
    }

    doc.moveDown();
    doc.text("Items:", { underline: true });

    (order.cartItems || []).forEach((item, i) => {
      doc.text(`${i + 1}. ${item.title} (x${item.qty}) — ₹${item.price * item.qty}`);
    });

    doc.moveDown();
    doc.text(`Total Price: ₹${order.totalPrice}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Order Status: ${order.orderStatus}`);
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

// ---------------------------
// 📦 EXPORT CONTROLLERS
// ---------------------------
module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  generateOrderReceipt,
};
