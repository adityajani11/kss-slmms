const Admin = require("../models/Admin");
const axios = require("axios");
const { saveOtp } = require("../utils/otpStore");
const { verifyOtp } = require("../utils/otpStore");

exports.sendAdminOtp = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOtp(admin.contactNumber, otp);

    const templateJson = {
      to: admin.contactNumber,
      recipient_type: "individual",
      type: "template",
      template: {
        language: {
          policy: "deterministic",
          code: "en",
        },
        name: "send_otp_message",
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    };

    await axios.post(process.env.WHATSAPP_API_URL, templateJson, {
      headers: {
        Authorization: `Bearer ${process.env.WHATAPI_TOKEN}`,
      },
    });

    res.json({ success: true, message: "OTP sent to admin" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOtpAndUpdatePassword = async (req, res) => {
  try {
    const { otp, passwordHash, type } = req.body;

    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isOtpValid = verifyOtp(admin.contactNumber, otp);

    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (type === "ADMIN_LOGIN") {
      admin.password = passwordHash;
    } else {
      admin.additionalPassword = passwordHash;
    }

    await admin.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Password update failed" });
  }
};

exports.verifyOtpAndUpdateProfile = async (req, res) => {
  try {
    const { otp, username, contactNumber } = req.body;

    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isValid = verifyOtp(admin.contactNumber, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (username) admin.username = username;
    if (contactNumber) admin.contactNumber = contactNumber;

    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully with OTP verification",
      user: {
        username: admin.username,
        contactNumber: admin.contactNumber,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};
