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
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
