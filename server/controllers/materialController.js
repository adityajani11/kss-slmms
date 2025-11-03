const Material = require("../models/Material");
const path = require("path");
const fs = require("fs");

// ---------------- CREATE ----------------
exports.create = async (req, res) => {
  try {
    const { title, standardId, subjectId, categoryId } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "File is required" });
    }

    // Save relative path (relative to /uploads)
    const relativePath = path.join("uploads/materials", req.file.filename);

    const doc = new Material({
      title,
      standardId,
      subjectId,
      categoryId,
      file: {
        storage: "fs",
        fileId: relativePath,
        size: req.file.size,
        mime: req.file.mimetype,
      },
    });

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("Error creating material:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ---------------- LIST ----------------
exports.list = async (req, res) => {
  try {
    const query = {};

    if (req.query.standardId) query.standardId = req.query.standardId;
    if (req.query.subjectId) query.subjectId = req.query.subjectId;
    if (req.query.categoryId) query.categoryId = req.query.categoryId;

    const items = await Material.find(query)
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    const formatted = items.map((item) => ({
      _id: item._id,
      title: item.title,
      file: item.file,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      standard: item.standardId?.standard || "N/A",
      subject: item.subjectId?.name || "N/A",
      category: item.categoryId?.name || "N/A",
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------- VIEW PDF ----------------
exports.getPdf = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, error: "Material not found" });
    }

    const filePath = material.file?.fileId;
    if (!filePath) {
      return res
        .status(400)
        .json({ success: false, error: "File path not found" });
    }

    // Resolve relative path from project root
    const absolutePath = path.join(__dirname, "..", filePath);

    // Verify file exists before sending
    if (!fs.existsSync(absolutePath)) {
      return res
        .status(404)
        .json({ success: false, error: "File not found on server" });
    }

    // Send file
    return res.sendFile(absolutePath);
  } catch (err) {
    console.error("Error serving PDF:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------- HARD DELETE ----------------
exports.hardDelete = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res
        .status(404)
        .json({ success: false, error: "Material not found" });
    }

    const filePath = material.file?.fileId;
    if (filePath) {
      const absolutePath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    await Material.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: "Material deleted permanently" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------- GET materials by standardId ----------------
exports.getByStandard = async (req, res) => {
  try {
    const { standardId } = req.params;
    if (!standardId) {
      return res
        .status(400)
        .json({ success: false, error: "standardId is required" });
    }

    const materials = await Material.find({
      standardId,
      deleted: { $ne: true },
    })
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    if (!materials || materials.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No material found for this standard.",
        });
    }

    res.json({ success: true, data: materials });
  } catch (err) {
    console.error("Error fetching materials:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
