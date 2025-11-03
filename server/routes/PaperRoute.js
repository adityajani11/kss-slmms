const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paperController");

router.post("/generate", ctrl.generatePaper);
router.post("/start", ctrl.startExam);
router.get("/attempt/:attemptId", ctrl.getAttempt);
router.post("/submit", ctrl.submitExam);
router.get("/history", ctrl.getHistory);
router.get("/mine", ctrl.getGeneratedPapers);
router.get("/:paperId/download", ctrl.downloadPaperPdf);

module.exports = router;
