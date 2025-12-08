 
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cors = require("cors");
const connectDB = require("../config/db");

dotenv.config();
const app = express();

 
app.use(
  cors({
    origin: [
      "http://localhost:5173", // ✅ local admin
      "https://saheli-store-in.vercel.app", // ✅ live frontend
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
 
app.options("*", cors());

 
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

 
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
 
let isDBConnected = false;

if (!isDBConnected) {
  connectDB();
  isDBConnected = true;
}
 
const productRoutes = require("../routes/productRoutes.js");
const orderRoutes = require("../routes/orderRoutes.js");

 
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

 
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Saheli Store API Root Working",
    server: "Vercel Node Server",
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});
 
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `❌ Route not found → ${req.originalUrl}`,
  });
});

 
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.message,
  });
});

 
module.exports = app;
