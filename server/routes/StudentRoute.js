const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentsController");

// optional: attach auth middleware as needed
router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.post("/login", ctrl.login);
router.post(
  "/verify-student-delete-password",
  ctrl.verifyStudentDeletePassword
);
router.get("/export", ctrl.export);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.softDelete);
router.post("/:id/restore", ctrl.restore);
router.delete("/:id/hard", ctrl.hardDelete);

module.exports = router;
