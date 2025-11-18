const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  updateContact,
  updatePassword,
  verifyAdditionalPassword,
} = require("../controllers/adminController");

// Routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/update-contact", updateContact);
router.put("/update-password", updatePassword);
router.post("/verify-additional-password", verifyAdditionalPassword);

module.exports = router;
