const Material = require("../models/Material");
const path = require("path");
const fs = require("fs");

// Create Material (after Multer upload)
exports.create = async (req, res) => {
  try {
    // Expect Multer to handle file upload, so file info is in req.file
    const { title, standardId, subjectId, categoryId } = req.body;
    // const { title, standardId, subjectId, categoryId, uploadedBy } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "File is required" });
    }

    const doc = new Material({
      title,
      standardId,
      subjectId,
      categoryId,
      // uploadedBy,
      file: {
        storage: "fs",
        fileId: req.file.path, // store the relative path
        size: req.file.size,
        mime: req.file.mimetype,
      },
    });

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// Get all materials (with optional filters)
exports.list = async (req, res) => {
  try {
    const query = {};

    if (req.query.standardId) query.standardId = req.query.standardId;
    if (req.query.subjectId) query.subjectId = req.query.subjectId;
    if (req.query.categoryId) query.categoryId = req.query.categoryId;

    const items = await Material.find(query)
      // .populate("uploadedBy", "name email")
      .populate("standardId", "name")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get single material by ID
exports.getPdf = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, error: "Material not found" });
    }

    // material.filePath should look like: "uploads/materials/1761766111480-ADITYA_....pdf"
    const filePath = path.join(__dirname, "..", material.filePath);

    res.sendFile(filePath);
  } catch (err) {
    console.error("Error serving PDF:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Hard delete material + file cleanup (optional)
exports.hardDelete = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, error: "Material not found" });
    }

    // Optional: remove file from filesystem
    if (material.file?.storage === "fs" && material.file?.fileId) {
      try {
        fs.unlinkSync(material.file.fileId);
      } catch (e) {
        console.warn("File deletion failed:", e.message);
      }
    }

    await Material.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: "Material deleted permanently" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
