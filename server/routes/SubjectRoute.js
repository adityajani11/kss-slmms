const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.post('/:id', ctrl.toggleActive);
router.delete('/:id', ctrl.delete);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.softDelete);
router.post('/:id/restore', ctrl.restore);
router.delete('/:id/hard', ctrl.hardDelete);

module.exports = router;
