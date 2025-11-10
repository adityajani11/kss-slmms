const express = require("express");
const router = express.Router();
const examAttemptController = require("../controllers/examAttemptController");

// POST - submit exam attempt
router.post("/submit", examAttemptController.submitExamAttempt);

router.get("/history", examAttemptController.getExamHistory);

module.exports = router;
