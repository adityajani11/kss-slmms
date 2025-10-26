const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  updateContact,
  updatePassword,
} = require("../controllers/adminController");

// Routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/update-contact", updateContact);
router.put("/update-password", updatePassword);

module.exports = router;
