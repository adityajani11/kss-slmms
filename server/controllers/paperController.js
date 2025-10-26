const Paper = require('../models/Paper');

const validateItems = (items) => {
  if (!Array.isArray(items)) return;
  // ensure order uniqueness and marks numeric
  const orders = new Set();
  for (const it of items) {
    if (typeof it.order !== 'number') throw new Error('item.order must be number');
    if (orders.has(it.order)) throw new Error('duplicate item.order');
    orders.add(it.order);
  }
};

exports.create = async (req, res) => {
  try {
    validateItems(req.body.items);
    const doc = new Paper(req.body);
    await doc.save();
    return res.status(201).json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const q = req.query.includeDisabled ? { includeDisabled: true } : {};
    if (req.query.standardId) q.standardId = req.query.standardId;
    const items = await Paper.find(q).sort({ createdAt: -1 });
    return res.json({ success:true, data: items });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const doc = await Paper.findById(req.params.id, req.query.includeDisabled ? { includeDisabled: true } : {});
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    if (req.body.items) validateItems(req.body.items);
    const doc = await Paper.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await Paper.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') await doc.softDelete();
    else { doc.disabled = true; await doc.save(); }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const doc = await Paper.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    doc.disabled = false; await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.hardDelete = async (req, res) => {
  try {
    await Paper.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
