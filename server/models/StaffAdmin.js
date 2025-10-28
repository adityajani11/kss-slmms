const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const staffAdminSchema = new Schema(
  {
    role: { type: String, enum: ["STAFF"], default: "STAFF" },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

staffAdminSchema.plugin(softDeletePlugin);

module.exports = mongoose.model("StaffAdmin", staffAdminSchema);
