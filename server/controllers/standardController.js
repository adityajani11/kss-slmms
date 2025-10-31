const Standard = require("../models/Standard");
const mongoose = require("mongoose");

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
    const { standard } = req.body;

    // Validate input
    if (!standard || standard < 9 || standard > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Standard must be between 9 and 12" });
    }

    // Check for existing standard
    const existingStandard = await Standard.findOne({ standard });
    if (existingStandard) {
      return res
        .status(400)
        .json({ success: false, message: "Standard already exists" });
    }

    // Create new standard
    const doc = new Standard({ standard });
    await doc.save();

    return res
      .status(201)
      .json({
        success: true,
        message: "Standard added successfully",
        data: doc,
      });
  } catch (err) {
    console.error("Error creating standard:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    // If ?includeDisabled=true, return all; otherwise only active ones
    const includeDisabled = req.query.includeDisabled === "true";
    const query = includeDisabled ? {} : { isActive: true };

    const standards = await Standard.find(query).sort({ standard: 1 });

    if (standards.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No standards found", data: [] });
    }

    return res.status(200).json({
      success: true,
      data: standards,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Toggle Standard Active/Inactive

exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid standard ID" });
    }

    const standard = await Standard.findById(id);
    if (!standard) {
      return res
        .status(404)
        .json({ success: false, message: "Standard not found" });
    }

    // Toggle active flag
    standard.isActive = !standard.isActive;
    await standard.save();

    return res.status(200).json({
      success: true,
      message: `Standard ${standard.standard} has been ${
        standard.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: {
        _id: standard._id,
        standard: standard.standard,
        isActive: standard.isActive,
      },
    });
  } catch (err) {
    console.error("Error toggling standard:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle standard status",
      error: err.message,
    });
  }
};

// Hard Delete Standard

exports.hardDelete = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid standard ID" });
    }

    const deleted = await Standard.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Standard not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Standard ${deleted.standard} deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting standard:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete standard",
      error: err.message,
    });
  }
};
