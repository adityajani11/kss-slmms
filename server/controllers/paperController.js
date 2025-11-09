// controllers/paperController.js
const mongoose = require("mongoose");
const MCQModel = require("../models/MCQ");
const Paper = require("../models/Paper");
const ExamAttempt = require("../models/ExamAttempt");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const { buildHTML } = require("./mcqController");
const puppeteer = require("puppeteer");
const Material = require("../models/Material");

// Utility: pick random items
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* ---------- SAVE STUDENT-GENERATED PAPER ---------- */
exports.generatePaper = async (req, res) => {
  try {
    const { mcqs, pdfHeading, includeAnswers, title } = req.body;
    const studentId = req.user?._id; // from auth middleware
    const standardId = req.user?.standardId;

    if (!studentId || !standardId) {
      return res.status(400).json({
        success: false,
        error: "Student or standard not found in request context",
      });
    }

    // --- Validate input ---
    if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No MCQs provided for PDF generation",
      });
    }

    // --- Fetch full MCQ data (for images, subjects, etc.) ---
    const mcqDocs = await MCQModel.find({ _id: { $in: mcqs } })
      .populate("subjectId categoryId")
      .lean();

    if (mcqDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No valid MCQs found for provided IDs",
      });
    }

    // --- Build the HTML using your existing builder ---
    const html = buildHTML(mcqDocs, pdfHeading || "Student Draft Paper");

    // --- Generate PDF buffer with Puppeteer ---
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle2" });
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 100));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
    });

    await browser.close();

    // --- Save the generated PDF in /uploads/materials ---
    const fileName = `StudentPaper_${Date.now()}.pdf`;
    const uploadDir = path.join(__dirname, "../uploads/materials");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // --- Create Material entry (if you have Material model for file refs) ---
    const materialDoc = await Material.create({
      title: fileName,
      type: "PDF",
      path: `uploads/materials/${fileName}`,
      uploadedBy: studentId,
      uploadedByModel: "Student",
      standardId,
    });

    // --- Derive subjects from MCQs ---
    const subjectIds = [
      ...new Set(mcqDocs.map((m) => m.subjectId?._id).filter(Boolean)),
    ];

    // --- Build Paper items array ---
    const paperItems = mcqDocs.map((m, i) => ({
      mcqId: m._id,
      marks: 1,
      order: i + 1,
    }));

    // --- Create Paper entry ---
    const paper = await Paper.create({
      title: title || "My Draft Paper",
      type: "STUDENT_DRAFT",
      createdBy: studentId,
      createdByModel: "Student",
      standardId,
      subjectIds,
      includeAnswers: !!includeAnswers,
      includeExplanations: false,
      totalMarks: paperItems.length,
      items: paperItems,
      generatedPdf: {
        fileId: materialDoc._id,
        at: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Paper generated and saved successfully.",
      data: paper,
    });
  } catch (err) {
    console.error("Paper Generation Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate and save paper",
    });
  }
};

/**
 * Start exam for a generated paper.
 * Body: { paperId }
 * Creates ExamAttempt with startedAt set now, responses empty, score.max = paper.totalMarks
 * Returns attemptId and startedAt & max duration.
 */
exports.startExam = async (req, res) => {
  try {
    const { paperId } = req.body;
    const studentId = req.user && req.user._id;
    if (!paperId || !studentId) {
      return res
        .status(400)
        .json({ success: false, error: "paperId required" });
    }

    const paper = await Paper.findById(paperId).populate("items.mcqId");
    if (!paper)
      return res.status(404).json({ success: false, error: "Paper not found" });

    // Ensure totalMarks <= 120
    if (paper.totalMarks > 120) {
      return res
        .status(400)
        .json({ success: false, error: "Paper exceeds maximum marks allowed" });
    }

    // Create or find open attempt (idempotency)
    let attempt = await ExamAttempt.findOne({
      studentId,
      paperId,
      submittedAt: { $exists: false },
    });

    if (!attempt) {
      attempt = new ExamAttempt({
        studentId,
        paperId,
        standardId: paper.standardId,
        subjectIds: paper.subjectIds,
        startedAt: new Date(),
        responses: [],
        score: { total: 0, max: paper.totalMarks },
      });
      await attempt.save();
    }

    // Duration rule: 1 mark = 1 minute
    const durationMinutes = paper.totalMarks;
    return res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        durationMinutes,
        paper: {
          _id: paper._id,
          title: paper.title,
          items: paper.items.map((it) => ({
            mcqId: it.mcqId._id,
            question: it.mcqId.question,
            options: it.mcqId.options,
          })),
        },
      },
    });
  } catch (err) {
    console.error("startExam error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get attempt data (used to resume).
 * Params: attemptId
 */
exports.getAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user && req.user._id;
    if (!attemptId)
      return res
        .status(400)
        .json({ success: false, error: "attemptId required" });

    const attempt = await ExamAttempt.findById(attemptId)
      .populate("paperId")
      .lean();
    if (!attempt)
      return res
        .status(404)
        .json({ success: false, error: "Attempt not found" });
    if (!attempt.studentId.equals(studentId))
      return res.status(403).json({ success: false, error: "Unauthorized" });

    // Compute duration from associated paper
    const paper = await Paper.findById(attempt.paperId._id).lean();
    const durationMinutes = paper.totalMarks;

    return res.json({
      success: true,
      data: { attempt, durationMinutes, paper },
    });
  } catch (err) {
    console.error("getAttempt error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Submit exam.
 * Body: { attemptId, responses: [{ mcqId, selectedIndex }] }
 * Grades the exam and sets submittedAt.
 */
exports.submitExam = async (req, res) => {
  try {
    const { attemptId, responses = [] } = req.body;
    const studentId = req.user && req.user._id;
    if (!attemptId)
      return res
        .status(400)
        .json({ success: false, error: "attemptId required" });

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt)
      return res
        .status(404)
        .json({ success: false, error: "Attempt not found" });
    if (!attempt.studentId.equals(studentId))
      return res.status(403).json({ success: false, error: "Unauthorized" });

    // Load paper + MCQs
    const paper = await Paper.findById(attempt.paperId).lean();
    const mcqIds = paper.items.map((it) => it.mcqId.toString());
    const mcqs = await MCQModel.find({ _id: { $in: mcqIds } }).lean();

    // Build map for grading
    const mcqMap = {};
    mcqs.forEach((m) => (mcqMap[m._id.toString()] = m));

    // Grade
    let totalAwarded = 0;
    const processed = responses.map((r) => {
      const mcq = mcqMap[r.mcqId];
      let selectedIndex =
        typeof r.selectedIndex === "number" ? r.selectedIndex : -1;
      let correct = false;
      if (mcq && mcq.options && mcq.options[selectedIndex]) {
        correct = !!mcq.options[selectedIndex].isCorrect;
      }
      const marksAwarded = correct ? 1 : 0;
      totalAwarded += marksAwarded;
      return {
        mcqId: r.mcqId,
        selectedIndex,
        correct,
        marksAwarded,
      };
    });

    attempt.responses = processed;
    attempt.submittedAt = new Date();
    attempt.score = { total: totalAwarded, max: paper.totalMarks };

    await attempt.save();

    return res.json({ success: true, data: attempt });
  } catch (err) {
    console.error("submitExam error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get exam history for student
 * Query params: page, limit
 */
exports.getHistory = async (req, res) => {
  try {
    const studentId = req.user && req.user._id;
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);

    const q = { studentId: mongoose.Types.ObjectId(studentId) };
    const total = await ExamAttempt.countDocuments(q);
    const items = await ExamAttempt.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("paperId", "title totalMarks")
      .lean();

    return res.json({ success: true, data: { total, page, limit, items } });
  } catch (err) {
    console.error("getHistory error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Get generated papers for student
 */
exports.getGeneratedPapers = async (req, res) => {
  try {
    const studentId = req.user && req.user._id;
    const papers = await Paper.find({ createdBy: studentId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: papers });
  } catch (err) {
    console.error("getGeneratedPapers error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

/**
 * Download/generate PDF for a paper.
 * Route: GET /papers/:paperId/download?answers=true&explanations=true&type=WITH_ANSWERS
 * This uses pdf-lib to assemble a simple PDF and apply watermark.
 * NOTE: For production, you'd store generated PDF into Material (S3/local FS) and return fileId or a signed url.
 */
exports.downloadPaperPdf = async (req, res) => {
  try {
    const { paperId } = req.params;
    const includeAnswers = req.query.answers === "true";
    const includeExplanations = req.query.explanations === "true";
    const userId = req.user && req.user._id;

    const paper = await Paper.findById(paperId).populate("items.mcqId").lean();
    if (!paper)
      return res.status(404).json({ success: false, error: "Paper not found" });

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText(paper.title || "Paper", {
      x: margin,
      y: y,
      size: 18,
      font: timesRomanFont,
    });
    y -= 30;

    // For each item
    for (const item of paper.items) {
      const mcq = item.mcqId;
      const qText = (mcq.question && mcq.question.text) || "";
      page.drawText(`${item.order || "?"}. ${qText}`, {
        x: margin,
        y: y,
        size: 11,
        font: timesRomanFont,
        maxWidth: width - margin * 2,
      });
      y -= 18;

      // options
      mcq.options.forEach((opt, idx) => {
        let optText = `   ${String.fromCharCode(65 + idx)}. ${opt.label || ""}`;
        if (includeAnswers && opt.isCorrect) {
          // bold representation - use same font but add marker
          optText += "  [ANSWER]";
        }
        page.drawText(optText, {
          x: margin + 8,
          y: y,
          size: 10,
          font: timesRomanFont,
          maxWidth: width - margin * 2,
        });
        y -= 14;
      });

      if (includeExplanations && mcq.explanation) {
        page.drawText(`   Explanation: ${mcq.explanation}`, {
          x: margin + 8,
          y: y,
          size: 9,
          font: timesRomanFont,
          maxWidth: width - margin * 2,
        });
        y -= 14;
      }

      y -= 8;
      if (y < margin + 80) {
        page.addPage();
        y = height - margin;
      }
    }

    // Watermark on every page (simple diagonal)
    const pages = pdfDoc.getPages();
    pages.forEach((pg) => {
      pg.drawText("KRISHNA SCHOOL GROUP KESHOD", {
        x: 100,
        y: 200,
        size: 40,
        font: timesRomanFont,
        color: rgb(0.8, 0.8, 0.8),
        rotate: { type: "degrees", angle: -30 },
        opacity: 0.25,
      });
    });

    const pdfBytes = await pdfDoc.save();

    // Send as download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${paper.title || "paper"}.pdf"`
    );
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("downloadPaperPdf error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
