// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db"); // Import DB connection logic
const routes = require("./routes"); // Import the index file from routes folder

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
connectDB();

const multer = require("multer");

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
  res.status(500).json({ message: "Server Error", error: err.message });
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
