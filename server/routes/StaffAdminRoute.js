const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/staffAdminController");

// API to get all counts (for admin dashboard)
router.get("/getAllCounts", ctrl.getAllCounts);

router.post("/", ctrl.create);
router.post("/login", ctrl.login);
router.get("/", ctrl.list);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.patch("/:id/toggle-disable", ctrl.toggleDisable);

module.exports = router;
