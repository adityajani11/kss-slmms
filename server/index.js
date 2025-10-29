// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const routes = require("./routes");
const multer = require("multer");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Serve uploads folder statically (for MCQ images, materials, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle multer upload errors globally
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, message: "File too large (max 200KB)." });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// API Routes
app.use("/api/v1", routes);

// Basic health check route
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
