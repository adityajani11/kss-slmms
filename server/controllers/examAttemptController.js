const ExamAttempt = require('../models/ExamAttempt');
const Paper = require('../models/Paper');
const MCQ = require('../models/MCQ');

// Start attempt (or create record)
exports.start = async (req, res) => {
  try {
    const payload = req.body;
    // optional: ensure unique active attempt per student+paper
    const existing = await ExamAttempt.findOne({ studentId: payload.studentId, paperId: payload.paperId, submittedAt: null });
    if (existing) return res.json({ success:true, data: existing });

    const doc = new ExamAttempt(payload);
    doc.startedAt = new Date();
    await doc.save();
    return res.status(201).json({ success:true, data: doc });
  } catch (err) { return res.status(400).json({ success:false, error: err.message }); }
};

// Submit attempt: compute score, mark submittedAt
exports.submit = async (req, res) => {
  try {
    const { attemptId, responses } = req.body;
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success:false, error: 'attempt not found' });
    if (attempt.submittedAt) return res.status(400).json({ success:false, error: 'already submitted' });

    // Build marks map from paper items
    const paper = await Paper.findById(attempt.paperId, { includeDisabled: true });
    const marksMap = new Map();
    if (paper && Array.isArray(paper.items)) {
      for (const it of paper.items) marksMap.set(String(it.mcqId), it.marks || 1);
    }

    const mcqIds = responses.map(r => r.mcqId);
    const mcqs = await MCQ.find({ _id: { $in: mcqIds }, includeDisabled: true });
    const mcqMap = new Map(mcqs.map(m => [String(m._id), m]));

    let total = 0, max = 0;
    const processed = [];

    for (const r of responses) {
      const mcq = mcqMap.get(String(r.mcqId));
      const marksForQ = marksMap.get(String(r.mcqId)) || 1;
      max += marksForQ;
      if (!mcq) {
        processed.push({ ...r, correct: false, marksAwarded: 0 });
        continue;
      }
      const selIdx = r.selectedIndex;
      const isCorrect = mcq.options && mcq.options[selIdx] && mcq.options[selIdx].isCorrect;
      const marksAwarded = isCorrect ? marksForQ : 0;
      if (marksAwarded) total += marksAwarded;
      processed.push({ ...r, correct: !!isCorrect, marksAwarded });
    }

    attempt.responses = processed;
    attempt.score = { total, max };
    attempt.submittedAt = new Date();
    await attempt.save();

    return res.json({ success:true, data: attempt });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const doc = await ExamAttempt.findById(req.params.id, req.query.includeDisabled ? { includeDisabled: true } : {});
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const q = req.query.includeDisabled ? { includeDisabled: true } : {};
    if (req.query.studentId) q.studentId = req.query.studentId;
    if (req.query.paperId) q.paperId = req.query.paperId;
    const items = await ExamAttempt.find(q).sort({ createdAt: -1 });
    return res.json({ success:true, data: items });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await ExamAttempt.findById(req.params.id);
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    if (typeof doc.softDelete === 'function') await doc.softDelete();
    else { doc.disabled = true; await doc.save(); }
    return res.json({ success:true, message: 'soft deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.restore = async (req, res) => {
  try {
    const doc = await ExamAttempt.findOne({ _id: req.params.id, includeDisabled: true });
    if (!doc) return res.status(404).json({ success:false, error: 'not found' });
    doc.disabled = false; await doc.save();
    return res.json({ success:true, data: doc });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};

exports.hardDelete = async (req, res) => {
  try {
    await ExamAttempt.deleteOne({ _id: req.params.id });
    return res.json({ success:true, message: 'hard deleted' });
  } catch (err) { return res.status(500).json({ success:false, error: err.message }); }
};
