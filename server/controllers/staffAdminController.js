const StaffAdmin = require("../models/StaffAdmin");
const Student = require("../models/Student");
const MCQ = require("../models/MCQ");
const Subject = require("../models/Subject");
const Category = require("../models/Category");
const Standard = require("../models/Standard");

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    // if role ADMIN ensure uniqueness (partial index will enforce too)
    if (payload.role === "ADMIN") {
      const existing = await StaffAdmin.findOne({
        role: "ADMIN",
        includeDisabled: true,
      });
      if (existing)
        return res
          .status(400)
          .json({ success: false, error: "ADMIN already exists" });
    }
    const doc = new StaffAdmin(payload);
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
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

// Create staff (already exists)
exports.create = async (req, res) => {
  try {
    const payload = req.body;

    if (payload.role === "ADMIN") {
      const existing = await StaffAdmin.findOne({ role: "ADMIN" });
      if (existing)
        return res
          .status(400)
          .json({ success: false, error: "ADMIN already exists" });
    }

    const doc = new StaffAdmin(payload);
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
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
