// routes/index.js
const express = require('express');
const router = express.Router();

// IMPLEMENT MIDDLEWARES - IMPORTANT

// Mounting routes to paths
router.use('/admin', require('./AdminRoute'));
router.use('/students', require('./StudentRoute'));
router.use('/staff', require('./StaffAdminRoute'));
router.use('/standards', require('./StandardRoute'));
router.use('/categories', require('./CategoryRoute'));
router.use('/subjects', require('./SubjectRoute'));
router.use('/mcqs', require('./MCQRoute'));
router.use('/papers', require('./PaperRoute'));
router.use('/materials', require('./MaterialRoute'));
router.use('/exams', require('./ExamAttemptRoute'));
router.use('/audit', require('./AuditLogsRoute'));
router.use('/exam-attempts', require('./ExamAttemptRoute'));

module.exports = router;
