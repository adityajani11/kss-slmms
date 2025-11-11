const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paperController");

router.post("/generate", ctrl.generatePaper);
router.post("/start", ctrl.startExam);
router.get("/attempt/:attemptId", ctrl.getAttempt);
router.post("/submit", ctrl.submitExam);
router.get("/history", ctrl.getHistory);
router.get("/mine", ctrl.getMyPapers);
router.get("/:paperId/download", ctrl.downloadPaper);
router.get("/:paperId/mcqs", ctrl.getPaperMcqs);
router.delete("/delete/:studentId/:paperId", ctrl.deletePaper);
module.exports = router;
