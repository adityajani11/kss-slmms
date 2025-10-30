require("../models/StaffAdmin");
const MCQ = require("../models/MCQ");
const fs = require("fs");
const path = require("path");

// basic validation helper
const ensureOneCorrect = (options) => {
  if (!Array.isArray(options) || options.length < 2)
    throw new Error("At least 2 options required");
  const correct = options.filter((o) => o.isCorrect);
  if (correct.length !== 1)
    throw new Error("Exactly one option must be correct");
};

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "on" || s === "yes";
}

exports.createMCQ = async (req, res) => {
  try {
    const { standardId, categoryId, subjectId, questionText, explanation } =
      req.body;

    if (!standardId || !categoryId || !subjectId || !questionText) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (standardId/categoryId/subjectId/questionText).",
        received: { standardId, categoryId, subjectId, questionText },
      });
    }

    // Reconstruct options from req.body keys robustly.
    // We find all indexes that match options[<index>][label]
    const optionIndexSet = new Set();
    for (const key of Object.keys(req.body)) {
      const m = key.match(/^options\[(\d+)\]\[label\]$/);
      if (m) optionIndexSet.add(Number(m[1]));
    }

    // Build parsedOptions in index order
    const parsedOptions = [];
    const indexes = Array.from(optionIndexSet).sort((a, b) => a - b);
    for (const i of indexes) {
      const labelKey = `options[${i}][label]`;
      const isCorrectKey = `options[${i}][isCorrect]`;
      const rawLabel = req.body[labelKey];
      const rawIsCorrect = req.body[isCorrectKey];
      // attach image if uploaded as optionImage_<i>
      const imagePath = req.files?.[`optionImage_${i}`]?.[0]?.path || null;

      parsedOptions.push({
        label: typeof rawLabel === "string" ? rawLabel.trim() : rawLabel,
        isCorrect: toBool(rawIsCorrect),
        image: imagePath,
      });
    }

    // If no options parsed, maybe frontend sent options as JSON string or as req.body.options
    if (parsedOptions.length === 0) {
      // Try alternative: options as JSON string in req.body.options
      if (req.body.options) {
        try {
          const alt =
            typeof req.body.options === "string"
              ? JSON.parse(req.body.options)
              : req.body.options;
          if (Array.isArray(alt)) {
            // Ensure proper shape
            alt.forEach((o, i) => {
              parsedOptions.push({
                label: o.label ?? "",
                isCorrect: toBool(o.isCorrect),
                image:
                  req.files?.[`optionImage_${i}`]?.[0]?.path || o.image || null,
              });
            });
          }
        } catch (err) {
          // ignore, we'll handle below
        }
      }
    }

    // final validation: must have options and exactly one correct
    if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No options found in request. Make sure keys like options[0][label] are sent.",
        bodyKeys: Object.keys(req.body),
      });
    }

    const correctCount = parsedOptions.filter(
      (o) => o.isCorrect === true
    ).length;
    if (correctCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Exactly one option must be marked as correct.",
        parsedOptions, // helpful for debugging
      });
    }

    const questionImagePath = req.files?.questionImage?.[0]?.path || null;

    const mcq = await MCQ.create({
      standardId,
      categoryId,
      subjectId,
      question: {
        text: questionText,
        image: questionImagePath,
        language: req.body.language || "gu",
        font: req.body.font || "Default",
      },
      options: parsedOptions,
      explanation: typeof explanation === "string" ? explanation.trim() : "",
      createdBy: req.user?._id || "000000000000000000000000",
    });

    return res.status(201).json({ success: true, data: mcq });
  } catch (err) {
    console.error("Error in createMCQ:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    // Build query dynamically
    const q = {};

    if (req.query.standardId) q.standardId = req.query.standardId;
    if (req.query.subjectId) q.subjectId = req.query.subjectId;
    if (req.query.categoryId) q.categoryId = req.query.categoryId;
    if (req.query.createdBy) q.createdBy = req.query.createdBy;

    // For future: handle disabled logic if soft-delete added
    if (req.query.includeDisabled === "true") {
      q.disabled = { $in: [true, false] };
    }

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch total count (for frontend pagination)
    const total = await MCQ.countDocuments(q);

    // Fetch paginated MCQs
    const items = await MCQ.find(q)
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      count: items.length,
      data: items,
    });
  } catch (err) {
    console.error("MCQ list error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await MCQ.findById(
      req.params.id,
      req.query.includeDisabled ? { includeDisabled: true } : {}
    );
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Helper to safely delete old file
function deleteFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete old image:", err.message);
    });
  }
}

// Update MCQ Controller
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing record
    const existing = await MCQ.findById(id);
    if (!existing)
      return res.status(404).json({ success: false, error: "MCQ not found" });

    // Parse options safely (JSON string or array)
    let options = req.body.options;
    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        return res
          .status(400)
          .json({ success: false, error: "Invalid options JSON" });
      }
    }

    // If no options provided in request, keep old options
    if (!options || !Array.isArray(options) || options.length === 0) {
      options = existing.options;
    }

    // Merge and replace images where new ones are uploaded
    const mergedOptions = options.map((opt, i) => {
      const existingOpt = existing.options[i] || {};
      const uploadedImg = req.files?.[`optionImage_${i}`]?.[0]?.path;

      if (uploadedImg) deleteFileIfExists(existingOpt.image);

      return {
        label: opt.label ?? existingOpt.label,
        isCorrect: toBool(opt.isCorrect ?? existingOpt.isCorrect),
        image: uploadedImg || existingOpt.image || null,
      };
    });

    // Validate exactly one correct option
    ensureOneCorrect(mergedOptions);

    // Build update data
    const updateData = {
      standardId: req.body.standardId || existing.standardId,
      categoryId: req.body.categoryId || existing.categoryId,
      subjectId: req.body.subjectId || existing.subjectId,
      question: {
        text: req.body.questionText || existing.question.text,
        image: existing.question.image,
        language: req.body.language || existing.question.language,
        font: req.body.font || existing.question.font,
      },
      options: mergedOptions,
      explanation: req.body.explanation || existing.explanation,
    };

    // Replace question image if uploaded
    if (req.files?.questionImage?.[0]) {
      deleteFileIfExists(existing.question.image);
      updateData.question.image = req.files.questionImage[0].path;
    }

    // Perform update
    const updated = await MCQ.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name");

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("MCQ update error:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await MCQ.findById(req.params.id);
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    if (typeof doc.softDelete === "function") await doc.softDelete();
    else {
      doc.disabled = true;
      await doc.save();
    }
    return res.json({ success: true, message: "soft deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.restore = async (req, res) => {
  try {
    const doc = await MCQ.findOne({
      _id: req.params.id,
      includeDisabled: true,
    });
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    doc.disabled = false;
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.hardDelete = async (req, res) => {
  try {
    await MCQ.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: "hard deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
