const Student = require("../models/Student");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { parseInt: _p } = Number;

// Helper: parse pagination
const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(req.query.limit || "20", 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;

    // Required field validation
    const requiredFields = [
      "fullName",
      "standardId",
      "contactNumber",
      "whatsappNumber",
      "city",
      "district",
      "schoolName",
    ];
    const missingFields = requiredFields.filter((f) => !payload[f]);
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(", ")}.`,
      });
    }

    // Check for duplicate username
    if (payload.username) {
      const existing = await Student.findOne({ username: payload.username });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username already exists. Please choose another.",
        });
      }
    }

    // Validate gender, category, and stream (if provided)
    const validGenders = ["Male", "Female"];
    const validCategories = ["SC", "ST", "OBC", "OPEN", "OTHER"];
    const validStreams = ["SCIENCE", "COMMERCE", "ARTS", "OTHER"];

    if (payload.gender && !validGenders.includes(payload.gender)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender value. Allowed: ${validGenders.join(", ")}`,
      });
    }

    if (payload.category && !validCategories.includes(payload.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category value. Allowed: ${validCategories.join(
          ", "
        )}`,
      });
    }

    if (payload.stream && !validStreams.includes(payload.stream)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stream value. Allowed: ${validStreams.join(", ")}`,
      });
    }

    // Create student document
    const newStudent = new Student({
      username: payload.username.toLowerCase(),
      passwordHash: payload.passwordHash,
      fullName: payload.fullName.trim(),
      city: payload.city.trim(),
      district: payload.district.trim(),
      schoolName: payload.schoolName.trim(),
      standardId: payload.standardId,
      stream: payload.stream || null,
      contactNumber: payload.contactNumber,
      whatsappNumber: payload.whatsappNumber,
      gender: payload.gender.trim(),
      cast: payload.cast.trim(),
      category: payload.category.trim(),
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student added successfully.",
      data: newStudent,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while adding the student.",
      error: err.message,
    });
  }
};

// Login API
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // Find student (ignore soft-deleted)
    const student = await Student.findOne({
      username,
      deleted: { $ne: true },
    }).populate("standardId", "standard");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: student._id,
        username: student.username,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Send minimal safe info
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: student._id,
        username: student.username,
        fullName: student.fullName,
        standard: student.standardId?.standard || "N/A",
        role: "student",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const q = {};

    // Filters
    if (req.query.standardId) q.standardId = req.query.standardId;
    if (req.query.city) q.city = new RegExp(req.query.city, "i");
    if (req.query.district) q.district = new RegExp(req.query.district, "i");
    if (req.query.category) q.category = req.query.category;
    if (req.query.stream) q.stream = req.query.stream;
    if (!req.query.includeDisabled) q.disabled = { $ne: true };

    // Fetch data
    const [items, total] = await Promise.all([
      Student.find(q)
        .populate("standardId", "standard")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(q),
    ]);

    return res.status(200).json({
      success: true,
      data: { items, total, page },
    });
  } catch (err) {
    console.error("Error listing students:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching student records.",
      error: err.message,
    });
  }
};

// Get Student by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find student by ID (ignore soft-deleted ones)
    const student = await Student.findOne({ _id: id, deleted: { $ne: true } })
      .select("-passwordHash -__v") // exclude sensitive/internal fields
      .populate("standardId", "standard");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student.",
      error: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Check if student exists
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Validate duplicate username (if changed)
    if (payload.username && payload.username !== existingStudent.username) {
      const duplicate = await Student.findOne({ username: payload.username });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Username already exists. Please choose another.",
        });
      }
    }

    // Validate enums (only if provided)
    const validGenders = ["Male", "Female"];
    const validCategories = ["SC", "ST", "OBC", "OPEN", "OTHER"];
    const validStreams = ["SCIENCE", "COMMERCE", "ARTS", "OTHER"];

    if (payload.gender && !validGenders.includes(payload.gender)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender value. Allowed: ${validGenders.join(", ")}`,
      });
    }

    if (payload.category && !validCategories.includes(payload.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category value. Allowed: ${validCategories.join(
          ", "
        )}`,
      });
    }

    if (payload.stream && !validStreams.includes(payload.stream)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stream value. Allowed: ${validStreams.join(", ")}`,
      });
    }

    // Prepare update fields safely
    const updateData = {
      ...(payload.username && { username: payload.username.toLowerCase() }),
      ...(payload.fullName && { fullName: payload.fullName.trim() }),
      ...(payload.city && { city: payload.city.trim() }),
      ...(payload.district && { district: payload.district.trim() }),
      ...(payload.schoolName && { schoolName: payload.schoolName.trim() }),
      ...(payload.standardId && { standardId: payload.standardId }),
      ...(payload.stream && { stream: payload.stream }),
      ...(payload.contactNumber && { contactNumber: payload.contactNumber }),
      ...(payload.whatsappNumber && { whatsappNumber: payload.whatsappNumber }),
      ...(payload.gender && { gender: payload.gender }),
      ...(payload.cast && { cast: payload.cast.trim() }),
      ...(payload.category && { category: payload.category }),
    };

    // Perform update
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("standardId", "standard");

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: updatedStudent,
    });
  } catch (err) {
    console.error("Error updating student:", err);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating the student.",
      error: err.message,
    });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await Student.findById(req.params.id);
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    if (typeof doc.softDelete === "function") {
      await doc.softDelete();
    } else {
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
    const doc = await Student.findOne({
      _id: req.params.id,
      includeDisabled: true,
    });
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    if (!("disabled" in doc))
      return res
        .status(400)
        .json({ success: false, error: "restore not supported" });
    doc.disabled = false;
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.hardDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    // Check if student exists
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Perform deletion
    await Student.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: `Student '${student.fullName}' deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting student:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the student.",
      error: err.message,
    });
  }
};
