const MCQ = require('../models/MCQ');

// basic validation helper
const ensureOneCorrect = (options) => {
  if (!Array.isArray(options) || options.length < 2) throw new Error('At least 2 options required');
  const correct = options.filter(o => o.isCorrect);
  if (correct.length !== 1) throw new Error('Exactly one option must be correct');
};

exports.create = async (req, res) => {
  try {
    ensureOneCorrect(req.body.options);
    const doc = new MCQ(req.body);
    await doc.save();
    return res.status(201).json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const q = req.query.includeDisabled ? { includeDisabled: true } : {};
    if (req.query.standardId) q.standardId = req.query.standardId;
    if (req.query.subjectId) q.subjectId = req.query.subjectId;
    const items = await MCQ.find(q).sort({ createdAt: -1 });
    return res.json({ success:true, data: items });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const doc = await MCQ.findById(req.params.id, req.query.includeDisabled ? { includeDisabled: true } : {});
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    if (req.body.options) ensureOneCorrect(req.body.options);
    const doc = await MCQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await MCQ.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') await doc.softDelete();
    else { doc.disabled = true; await doc.save(); }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const doc = await MCQ.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    doc.disabled = false; await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.hardDelete = async (req, res) => {
  try {
    await MCQ.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
