const StaffAdmin = require("../models/StaffAdmin");
const Student = require("../models/Student");
const MCQ = require("../models/MCQ");
const Subject = require("../models/Subject");
const Category = require("../models/Category");
const Standard = require("../models/Standard");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Create new staff
exports.create = async (req, res) => {
  try {
    const payload = req.body;

    // Check if ADMIN already exists (only one allowed)
    if (payload.role === "ADMIN") {
      const existing = await StaffAdmin.findOne({ role: "ADMIN" });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "An ADMIN account already exists.",
        });
      }
    }

    // Ensure required fields
    if (!payload.password) {
      return res
        .status(400)
        .json({ success: false, error: "Password is required." });
    }

    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(payload.password, salt);

    // Create new staff record
    const doc = new StaffAdmin({
      ...payload,
      password: hashedPassword,
    });

    await doc.save();

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully.",
      data: {
        id: doc._id,
        username: doc.username,
        fullName: doc.fullName,
        email: doc.email,
        role: doc.role,
      },
    });
  } catch (err) {
    console.error("Error creating Staff:", err);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// Login staff
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find staff by username
    const staff = await StaffAdmin.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if account is disabled
    if (staff.isDisabled) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled. Please contact the administrator.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: staff._id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: staff._id,
          username: staff.username,
          fullName: staff.fullName,
          role: staff.role.toLowerCase(),
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// List all staff
exports.list = async (req, res) => {
  try {
    const staff = await StaffAdmin.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: { items: staff } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Update staff (general edit)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await StaffAdmin.findByIdAndUpdate(id, payload, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ success: false, error: "Not found" });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// Delete staff
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StaffAdmin.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, error: "Not found" });

    return res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Toggle disable status
exports.toggleDisable = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffAdmin.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, error: "Not found" });

    staff.isDisabled = !staff.isDisabled;
    await staff.save();

    return res.json({
      success: true,
      message: `Staff ${
        staff.isDisabled ? "disabled" : "enabled"
      } successfully`,
      data: staff,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get counts of various entities
exports.getAllCounts = async (req, res) => {
  try {
    const [
      staffCount,
      studentCount,
      mcqCount,
      subjectCount,
      categoryCount,
      standardCount,
    ] = await Promise.all([
      StaffAdmin.countDocuments(),
      Student.countDocuments(),
      MCQ.countDocuments(),
      Subject.countDocuments(),
      Category.countDocuments(),
      Standard.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        staff: staffCount,
        students: studentCount,
        mcqs: mcqCount,
        subjects: subjectCount,
        categories: categoryCount,
        standards: standardCount,
      },
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve counts",
      data: {
        staff: "N/A",
        students: "N/A",
        mcqs: "N/A",
        subjects: "N/A",
        categories: "N/A",
        standards: "N/A",
      },
    });
  }
};
