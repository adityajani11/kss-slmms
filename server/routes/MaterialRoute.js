const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ctrl = require("../controllers/materialController");

// Ensure uploads/materials directory exists
const uploadDir = path.join(__dirname, "../uploads/materials");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// Filter only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

// ===== Routes =====

// Upload new material (PDF)
router.post("/", upload.single("file"), ctrl.create);

// Get list of materials (supports filtering by standardId, subjectId, categoryId)
router.get("/", ctrl.list);

// Get single material by ID
router.get("/:id", ctrl.getPdf);

// Permanently delete material + file
router.delete("/:id/hard", ctrl.hardDelete);

// Get materials by standard
router.get("/by-standard/:standardId", ctrl.getByStandard);

module.exports = router;
