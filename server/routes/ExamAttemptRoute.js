const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examAttemptController');

router.post('/start', ctrl.start);
router.post('/submit', ctrl.submit);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.delete('/:id', ctrl.softDelete);
router.post('/:id/restore', ctrl.restore);
router.delete('/:id/hard', ctrl.hardDelete);

module.exports = router;
