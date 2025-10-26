const Standard = require('../models/Standard');

const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.create = async (req, res) => {
  try {
    const { standard } = req.body;

    // Validate input
    if (!standard || standard < 1 || standard > 12) {
      return res
        .status(400)
        .json({ success: false, message: "Standard must be between 1 and 12" });
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
      .json({ success: true, message: "Standard added successfully", data: doc });
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
      return res.status(200).json({ success: true, message: "No standards found", data: [] });
    }

    return res.status(200).json({
      success: true,
      data: standards
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


exports.getById = async (req, res) => {
  try {
    const doc = await Standard.findById(req.params.id, req.query.includeDisabled ? { includeDisabled: true } : {});
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    // prevent name change conflicts if needed
    const doc = await Standard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await Standard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') await doc.softDelete();
    else { doc.disabled = true; await doc.save(); }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const doc = await Standard.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    doc.disabled = false; await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.hardDelete = async (req, res) => {
  try {
    await Standard.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
