const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/standardController');

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', ctrl.toggleActive);
router.delete('/:id/hard', ctrl.hardDelete);

module.exports = router;
