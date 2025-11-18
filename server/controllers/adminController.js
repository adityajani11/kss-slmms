const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register Admin (only once)
exports.registerAdmin = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const { username, password, contactNumber } = req.body;
    if (!username || !password || !contactNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      password: hashedPassword,
      contactNumber,
    });

    await admin.save();
    res.status(201).json({ message: "Admin registered successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login Admin
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" } // you can adjust expiry
    );

    // Return token + admin info (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Contact Number
exports.updateContact = async (req, res) => {
  try {
    const { contactNumber } = req.body;
    if (!contactNumber) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.contactNumber = contactNumber;
    await admin.save();

    res.status(200).json({ message: "Contact updated successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Password
exports.updatePassword = async (req, res) => {
  try {
    const { type, passwordHash } = req.body;

    if (!type || !passwordHash)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const admin = await Admin.findOne(); // only one admin

    if (!admin)
      return res.status(404).json({ success: false, error: "Admin not found" });

    if (type === "ADMIN_LOGIN") {
      admin.password = passwordHash;
    } else if (type === "STUDENT_DELETE") {
      admin.additionalPassword = passwordHash;
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Invalid password type" });
    }

    await admin.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// API For verifying additional password
exports.verifyAdditionalPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, error: "Password required" });
    }

    // Assuming single admin OR logged-in admin id from JWT
    const admin = await Admin.findOne(); // If single admin exists

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, error: "Delete password not set by admin" });
    }

    const isMatch = await bcrypt.compare(password, admin.additionalPassword);

    if (!isMatch) {
      return res.json({ success: false, error: "Invalid password" });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
