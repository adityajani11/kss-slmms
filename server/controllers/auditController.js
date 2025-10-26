const AuditLog = require('../models/AuditLog');

exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.actorId) q.actorId = req.query.actorId;
    if (req.query.collection) q['entity.collection'] = req.query.collection;
    const items = await AuditLog.find(q).sort({ at: -1 }).limit(1000);
    return res.json({ success:true, data: items });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const doc = await AuditLog.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
