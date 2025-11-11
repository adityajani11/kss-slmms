require("../models/StaffAdmin");
const MCQ = require("../models/MCQ");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const katex = require("katex");

// basic validation helper
const ensureOneCorrect = (options) => {
  if (!Array.isArray(options) || options.length < 2)
    throw new Error("At least 2 options required");
  const correct = options.filter((o) => o.isCorrect);
  if (correct.length !== 1)
    throw new Error("Exactly one option must be correct");
};

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "on" || s === "yes";
}

exports.createMCQ = async (req, res) => {
  try {
    const { standardId, categoryId, subjectId, questionText, explanation } =
      req.body;

    if (!standardId || !categoryId || !subjectId || !questionText) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (standardId/categoryId/subjectId/questionText).",
        received: { standardId, categoryId, subjectId, questionText },
      });
    }

    // Reconstruct options from req.body keys robustly.
    // We find all indexes that match options[<index>][label]
    const optionIndexSet = new Set();
    for (const key of Object.keys(req.body)) {
      const m = key.match(/^options\[(\d+)\]\[label\]$/);
      if (m) optionIndexSet.add(Number(m[1]));
    }

    // Build parsedOptions in index order
    const parsedOptions = [];
    const indexes = Array.from(optionIndexSet).sort((a, b) => a - b);
    for (const i of indexes) {
      const labelKey = `options[${i}][label]`;
      const isCorrectKey = `options[${i}][isCorrect]`;
      const rawLabel = req.body[labelKey];
      const rawIsCorrect = req.body[isCorrectKey];
      // attach image if uploaded as optionImage_<i>
      const imagePath = req.files?.[`optionImage_${i}`]?.[0]?.path || null;

      parsedOptions.push({
        label: typeof rawLabel === "string" ? rawLabel.trim() : rawLabel,
        isCorrect: toBool(rawIsCorrect),
        image: imagePath,
      });
    }

    // If no options parsed, maybe frontend sent options as JSON string or as req.body.options
    if (parsedOptions.length === 0) {
      // Try alternative: options as JSON string in req.body.options
      if (req.body.options) {
        try {
          const alt =
            typeof req.body.options === "string"
              ? JSON.parse(req.body.options)
              : req.body.options;
          if (Array.isArray(alt)) {
            // Ensure proper shape
            alt.forEach((o, i) => {
              parsedOptions.push({
                label: o.label ?? "",
                isCorrect: toBool(o.isCorrect),
                image:
                  req.files?.[`optionImage_${i}`]?.[0]?.path || o.image || null,
              });
            });
          }
        } catch (err) {
          // ignore, we'll handle below
        }
      }
    }

    // final validation: must have options and exactly one correct
    if (!Array.isArray(parsedOptions) || parsedOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No options found in request. Make sure keys like options[0][label] are sent.",
        bodyKeys: Object.keys(req.body),
      });
    }

    const correctCount = parsedOptions.filter(
      (o) => o.isCorrect === true
    ).length;
    if (correctCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Exactly one option must be marked as correct.",
        parsedOptions, // helpful for debugging
      });
    }

    const questionImagePath = req.files?.questionImage?.[0]?.path || null;

    const mcq = await MCQ.create({
      standardId,
      categoryId,
      subjectId,
      question: {
        text: questionText,
        image: questionImagePath,
        language: req.body.language || "gu",
        font: req.body.font || "Default",
      },
      options: parsedOptions,
      explanation: typeof explanation === "string" ? explanation.trim() : "",
      createdBy: req.user?._id || "000000000000000000000000",
    });

    return res.status(201).json({ success: true, data: mcq });
  } catch (err) {
    console.error("Error in createMCQ:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    // Build query dynamically
    const q = {};

    if (req.query.standardId) q.standardId = req.query.standardId;
    if (req.query.subjectId) q.subjectId = req.query.subjectId;
    if (req.query.categoryId) q.categoryId = req.query.categoryId;
    if (req.query.createdBy) q.createdBy = req.query.createdBy;

    // For future: handle disabled logic if soft-delete added
    if (req.query.includeDisabled === "true") {
      q.disabled = { $in: [true, false] };
    }

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch total count (for frontend pagination)
    const total = await MCQ.countDocuments(q);

    // Fetch paginated MCQs
    const items = await MCQ.find(q)
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      count: items.length,
      data: items,
    });
  } catch (err) {
    console.error("MCQ list error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await MCQ.findById(
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

// Helper to safely delete old file
function deleteFileIfExists(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete old image:", err.message);
    });
  }
}

// Update MCQ Controller
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing record
    const existing = await MCQ.findById(id);
    if (!existing)
      return res.status(404).json({ success: false, error: "MCQ not found" });

    // Parse options safely (JSON string or array)
    let options = req.body.options;
    if (typeof options === "string") {
      try {
        options = JSON.parse(options);
      } catch {
        return res
          .status(400)
          .json({ success: false, error: "Invalid options JSON" });
      }
    }

    // If no options provided in request, keep old options
    if (!options || !Array.isArray(options) || options.length === 0) {
      options = existing.options;
    }

    // Merge and replace images where new ones are uploaded
    const mergedOptions = options.map((opt, i) => {
      const existingOpt = existing.options[i] || {};
      const uploadedImg = req.files?.[`optionImage_${i}`]?.[0]?.path;

      if (uploadedImg) deleteFileIfExists(existingOpt.image);

      return {
        label: opt.label ?? existingOpt.label,
        isCorrect: toBool(opt.isCorrect ?? existingOpt.isCorrect),
        image: uploadedImg || existingOpt.image || null,
      };
    });

    // Validate exactly one correct option
    ensureOneCorrect(mergedOptions);

    // Build update data
    const updateData = {
      standardId: req.body.standardId || existing.standardId,
      categoryId: req.body.categoryId || existing.categoryId,
      subjectId: req.body.subjectId || existing.subjectId,
      question: {
        text: req.body.questionText || existing.question.text,
        image: existing.question.image,
        language: req.body.language || existing.question.language,
        font: req.body.font || existing.question.font,
      },
      options: mergedOptions,
      explanation: req.body.explanation || existing.explanation,
    };

    // Replace question image if uploaded
    if (req.files?.questionImage?.[0]) {
      deleteFileIfExists(existing.question.image);
      updateData.question.image = req.files.questionImage[0].path;
    }

    // Perform update
    const updated = await MCQ.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("standardId", "standard")
      .populate("subjectId", "name")
      .populate("categoryId", "name");

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("MCQ update error:", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const doc = await MCQ.findById(req.params.id);
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
    const doc = await MCQ.findOne({
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
    await MCQ.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: "hard deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get MCQs by Standard ID
exports.getByStandard = async (req, res) => {
  try {
    const { standardId } = req.params;
    if (!standardId)
      return res
        .status(400)
        .json({ success: false, error: "standardId required" });

    const mcqs = await MCQ.find({
      standardId,
      deleted: { $ne: true },
    })
      .populate("subjectId", "name")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    if (!mcqs.length)
      return res.status(404).json({ success: false, message: "No MCQs found" });

    res.json({ success: true, data: mcqs });
  } catch (err) {
    console.error("Error fetching MCQs:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

/* ---------- HELPER: HTML Builder ---------- */
function buildHTML(mcqs, pdfHeading = "") {
  const katexCSS = fs.readFileSync(
    require.resolve("katex/dist/katex.min.css"),
    "utf8"
  );

  const nilkanthFontPath = path.join(__dirname, "../fonts/Nilkanth.ttf");
  const nilkanthFontBase64 = fs
    .readFileSync(nilkanthFontPath)
    .toString("base64");

  const safeHeading = pdfHeading?.trim() || "";

  const header = `
  <!DOCTYPE html>
  <html lang="gu">
  <head>
    <meta charset="UTF-8" />
    <title>MCQ</title>
    <style>
      @font-face {
        font-family: 'Nilkanth';
        src: url(data:font/truetype;charset=utf-8;base64,${nilkanthFontBase64}) format('truetype');
      }

      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #000;
        font-size: 14px;
        margin: 30px 40px;
        position: relative;
      }

      body::before {
        content: "KRISHNA SCHOOL GROUP";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 60px;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.08);
        z-index: -2;
        white-space: nowrap;
        pointer-events: none;
      }

      body::after {
        content: "";
        position: fixed;
        top: 0px;
        bottom: 0px;
        left: 0px;
        right: 0px;
        border: 2px solid #444;
        z-index: -1;
        pointer-events: none;
      }

      .guj {
        font-family: 'Nilkanth', Arial, sans-serif;
      }

      .latin {
        font-family: Arial, sans-serif;
      }

      .header {
        text-align: center;
        margin-bottom: 25px;
        column-span: all;
      }

      .school-name {
        font-weight: bold;
        font-size: 20px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #111;
      }

      .pdf-heading {
        font-size: 16px;
        font-weight: 600;
        margin-top: 4px;
        color: #333;
      }

      .divider {
        width: 60%;
        height: 2px;
        background: #222;
        margin: 8px auto 12px auto;
      }

      /* Updated for left-to-right column fill */
      .columns {
        column-count: 2;
        column-gap: 40px;
        column-rule: 2px solid #ccc;
        column-fill: auto; /* <-- Added: fills left column first */
      }

      .mcq {
        break-inside: avoid;
        margin-bottom: 18px;
        padding-bottom: 8px;
      }

      .q {
        font-weight: 500;
        margin-bottom: 5px;
      }

      .mcq-img {
        display: block;
        max-width: 80%;
        height: auto;
        margin: 8px auto 12px auto;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .opts {
        margin-left: 20px;
        margin-top: 2px;
      }

      .opt {
        margin: 2px 0;
      }

      .opt-img {
        display: block;
        max-width: 70%;
        height: auto;
        margin-top: 4px;
        margin-left: 25px;
        border: 1px solid #ccc;
        border-radius: 3px;
      }

      .ans {
        color: green;
        font-style: italic;
        margin-top: 3px;
      }

      .exp {
        margin-top: 5px;
      }

      ${katexCSS}
    </style>
  </head>
  <body>
    <div class="header">
      <div class="school-name">KRISHNA SCHOOL GROUP</div>
      <div class="divider"></div>
      <div class="pdf-heading">${wrapGujarati(safeHeading)}</div>
    </div>

    <div class="columns">
  `;

  let content = "";

  mcqs.forEach((mcq, i) => {
    const q = wrapGujarati(renderKaTeXInline(mcq.question.text || ""));

    // Build full image URL if relative
    let qImage = mcq.question?.image || "";
    if (qImage && !/^https?:\/\//i.test(qImage)) {
      qImage = `${
        process.env.BASE_URL || "http://localhost:5000"
      }/${qImage.replace(/\\/g, "/")}`;
    }

    const qImageTag = qImage
      ? `<img src="${qImage}" class="mcq-img" alt="MCQ Image" />`
      : "";

    const opts = mcq.options
      .map((o, idx) => {
        const optText = wrapGujarati(renderKaTeXInline(o.label || ""));
        let optImage = o.image || "";
        if (optImage && !/^https?:\/\//i.test(optImage)) {
          optImage = `${
            process.env.BASE_URL || "http://localhost:5000"
          }/${optImage.replace(/\\/g, "/")}`;
        }

        const optImgTag = optImage
          ? `<img src="${optImage}" class="opt-img" alt="Option Image" />`
          : "";

        return `<div class="opt"><span class="latin">(${String.fromCharCode(
          65 + idx
        )})</span> ${optText} ${optImgTag}</div>`;
      })
      .join("");

    const ansIdx = mcq.options.findIndex((o) => o.isCorrect);
    const ansLetter = ansIdx >= 0 ? String.fromCharCode(65 + ansIdx) : "?";
    const exp = mcq.explanation
      ? wrapGujarati(renderKaTeXInline(mcq.explanation))
      : "";

    content += `
      <div class="mcq">
        <div class="q"><b>${i + 1}.</b> ${q}</div>
        ${qImageTag}
        <div class="opts">${opts}</div>
        <div class="ans"><span class="latin">Ans: ${ansLetter}</span></div>
        ${exp ? `<div class="exp"><b class="guj">સમજૂતી:</b> ${exp}</div>` : ""}
      </div>
    `;
  });

  return header + content + "</div></body></html>";
}

/* ---------- HELPER: KaTeX inline renderer ---------- */
function renderKaTeXInline(text) {
  return text.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return match;
    }
  });
}

/* ---------- HELPER: Gujarati auto-wrapper ---------- */
function wrapGujarati(text) {
  // Detect Gujarati script Unicode range: \u0A80–\u0AFF
  return text.replace(/([\u0A80-\u0AFF]+)/g, "<span class='guj'>$1</span>");
}

/* ---------- API: DOWNLOAD MCQ PDF ROUTE ---------- */
exports.getFilteredMcqPDF = async (req, res) => {
  try {
    const { mcqs, pdfHeading } = req.body;

    // Validate input
    if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No MCQs provided for export",
      });
    }

    // --- Build the same HTML using your existing builder ---
    const html = buildHTML(mcqs, pdfHeading);

    // --- Generate PDF using Puppeteer (same setup) ---
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

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Filtered-MCQs.pdf"',
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Filtered PDF generation error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate filtered PDF" });
  }
};
