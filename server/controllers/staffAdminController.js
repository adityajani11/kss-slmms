const StaffAdmin = require("../models/StaffAdmin");

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

exports.list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);

    const includeDisabled = req.query.includeDisabled === "true";
    const filter = includeDisabled ? {} : { disabled: false };

    // Exclude `_id` from result set
    const projection = { _id: 0, __v: 0, password: 0 };

    const [items, total] = await Promise.all([
      StaffAdmin.find(filter, projection)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      StaffAdmin.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { items, total, page },
    });
  } catch (err) {
    console.error("Error fetching staff list:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await StaffAdmin.findById(
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

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.role; // optionally prevent role change
    const doc = await StaffAdmin.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!doc)
      return res.status(404).json({ success: false, error: "not found" });
    return res.json({ success: true, data: doc });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await StaffAdmin.findById(req.params.id);
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
    const doc = await StaffAdmin.findOne({
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
    await StaffAdmin.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: "hard deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
