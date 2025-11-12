const Material = require("../models/Material");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// ---------------- CREATE ----------------
exports.create = async (req, res) => {
  try {
    const { title, standardId, subjectId, categoryId } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "File is required" });
    }

    // Determine uploader info
    const uploadedBy = req.body.uploadedBy || null;
    const uploadedByModel = req.body.uploadedByModel || "staffAdmin";

    if (!uploadedBy || !uploadedByModel) {
      return res.status(401).json({
        success: false,
        error: "Uploader information missing or unauthorized.",
      });
    }

    // always use forward slashes, even on Windows
    const relativePath = `uploads/materials/${req.file.filename}`.replace(
      /\\/g,
      "/"
    );

    const doc = new Material({
      title,
      standardId,
      subjectId,
      categoryId,
      uploadedBy,
      uploadedByModel,

      // Required top-level path (matches schema)
      path: relativePath,

      // Also store in file.fileId for consistency
      file: {
        storage: "fs",
        fileId: relativePath,
        size: req.file.size,
        mime: req.file.mimetype,
      },
    });

    await doc.save();

    return res.status(201).json({
      success: true,
      message: "Material uploaded successfully.",
      data: doc,
    });
  } catch (err) {
    console.error("Error creating material:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------- LIST ----------------
exports.list = async (req, res) => {
  try {
    // Exclude student uploads
    const query = {
      $or: [{ uploadedByModel: { $ne: "student" } }],
    };

    if (req.query.standardId) query.standardId = req.query.standardId;
    if (req.query.subjectId) query.subjectId = req.query.subjectId;
    if (req.query.categoryId) query.categoryId = req.query.categoryId;

    const items = await Material.find(query)
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .populate({
        path: "uploadedBy",
        model: "staffAdmin", // populate only staffadmin model
        select: "fullName", // get only fullName field
      })
      .sort({ createdAt: -1 });

    const formatted = items.map((item) => {
      // Normalize slashes in both top-level path and file.fileId
      const normalizedPath = item.path ? item.path.replace(/\\/g, "/") : null;
      const normalizedFile =
        item.file && item.file.fileId
          ? { ...item.file, fileId: item.file.fileId.replace(/\\/g, "/") }
          : item.file;

      return {
        _id: item._id,
        title: item.title,
        path: normalizedPath, // Include top-level path (normalized)
        file: normalizedFile, // Include normalized file info
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        standard: item.standardId?.standard || "N/A",
        subject: item.subjectId?.name || "N/A",
        category: item.categoryId?.name || "N/A",
        uploadedBy:
          item.uploadedByModel === "staffadmin"
            ? item.uploadedBy?.fullName || "Admin"
            : "Admin",
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("Error fetching materials:", err);
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

    // Exclude all materials uploaded by students (case-insensitive)
    const materials = await mongoose.connection.db
      .collection("materials") // direct native Mongo query
      .find({
        standardId: new mongoose.Types.ObjectId(standardId),
        deleted: { $ne: true },
        $or: [
          { uploadedByModel: { $exists: false } },
          { uploadedByModel: { $not: /^student$/i } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (!materials || materials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No material found for this standard.",
      });
    }

    // Repopulate manually since we used native query
    const populated = await Material.populate(materials, [
      { path: "standardId", select: "standard" },
      { path: "subjectId", select: "name" },
      { path: "categoryId", select: "name" },
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error("Error fetching materials:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
