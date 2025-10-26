const Student = require('../models/Student');
const { parseInt: _p } = Number;

// Helper: parse pagination
const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;

    // Basic validation
    if (!payload.fullName || !payload.standardId || !payload.contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, standard, and contact number are required fields.",
      });
    }

    // Optional: prevent duplicate username if username field exists
    if (payload.username) {
      const existing = await Student.findOne({ username: payload.username });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username already exists. Please choose another.",
        });
      }
    }

    // Create new student record
    const newStudent = new Student(payload);
    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student added successfully.",
      data: newStudent,
    });
  } catch (err) {
    console.error("Error creating student:", err);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while adding the student.",
      error: err.message,
    });
  }
};


exports.list = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);

    const q = {};
    if (req.query.standardId) q.standardId = req.query.standardId;
    if (req.query.city) q.city = req.query.city;
    if (!req.query.includeDisabled) q.disabled = { $ne: true };

    const [items, total] = await Promise.all([
      Student.find(q)
        .populate("standardId", "standard") // populate only 'standard' field
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Student.countDocuments(q)
    ]);

    return res.json({
      success: true,
      data: { items, total, page },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};


exports.getById = async (req, res) => {
  try {
    const q = req.query.includeDisabled ? { includeDisabled: true } : {};
    const doc = await Student.findById(req.params.id, q);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    // prevent immutable change
    delete updates.standardId;
    // don't allow username change here optionally
    // delete updates.username;

    const opts = { new: true };
    const doc = await Student.findByIdAndUpdate(req.params.id, updates, opts);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) {
    return res.status(400).json({ success:false, error: err.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await Student.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') {
      await doc.softDelete();
    } else {
      doc.disabled = true;
      await doc.save();
    }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  }
};

exports.restore = async (req, res) => {
  try {
    const doc = await Student.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (!('disabled' in doc)) return res.status(400).json({ success:false, error: 'restore not supported' });
    doc.disabled = false;
    await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  }
};

exports.hardDelete = async (req, res) => {
  try {
    await Student.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) {
    return res.status(500).json({ success:false, error: err.message });
  }
};
