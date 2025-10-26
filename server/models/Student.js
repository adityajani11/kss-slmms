const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const studentSchema = new Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  schoolName: { type: String, required: true, trim: true },
  standardId: { type: Schema.Types.ObjectId, ref: "Standard", required: true, immutable: true },
  contactNumber: { type: Number, required: true, trim: true },
  gender: { type: String, enum: ["Male", "Female"] },
  cast: { type: String, trim: true },
  religion: { type: String, trim: true }
}, { timestamps: true });

studentSchema.plugin(softDeletePlugin);

module.exports = mongoose.model("Student", studentSchema);
