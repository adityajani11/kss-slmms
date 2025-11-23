const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentsController");

// optional: attach auth middleware as needed
router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.post("/login", ctrl.login);
router.get("/export", ctrl.export);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.softDelete); // remove
router.post("/:id/restore", ctrl.restore); // remove
router.delete("/:id/hard", ctrl.hardDelete);
// // routes/student.routes.js
// router.post("/students/:id/send-otp", sendOtp);

module.exports = router;
