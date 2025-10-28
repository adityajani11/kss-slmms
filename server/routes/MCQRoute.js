const express = require('express');
const router = express.Router();
const upload = require("../middleware/uploadMCQ");
const ctrl = require('../controllers/mcqController');

router.post(
  "/",
  upload.fields([
    { name: "questionImage", maxCount: 1 },
    { name: "optionImage_0", maxCount: 1 },
    { name: "optionImage_1", maxCount: 1 },
    { name: "optionImage_2", maxCount: 1 },
    { name: "optionImage_3", maxCount: 1 },
  ]),
  ctrl.createMCQ
);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.softDelete);
router.post('/:id/restore', ctrl.restore);
router.delete('/:id/hard', ctrl.hardDelete);

module.exports = router;
