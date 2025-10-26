const Subject = require('../models/Subject');

// Create Subject
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Subject already exists" });
    }

    const subject = new Subject({ name: name.trim() });
    await subject.save();

    return res.status(201).json({ success: true, data: subject });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// List Subjects
exports.list = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Toggle Active Status
exports.toggleActive = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    subject.isActive = !subject.isActive;
    await subject.save();

    res.json({
      success: true,
      message: `Subject ${subject.isActive ? "activated" : "deactivated"} successfully`,
      data: subject,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete Subject
exports.delete = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};



exports.getById = async (req, res) => {
  try {
    const doc = await Subject.findById(req.params.id, req.query.includeDisabled ? { includeDisabled: true } : {});
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const doc = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await Subject.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') await doc.softDelete();
    else { doc.disabled = true; await doc.save(); }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const doc = await Subject.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    doc.disabled = false; await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.hardDelete = async (req, res) => {
  try {
    await Subject.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
