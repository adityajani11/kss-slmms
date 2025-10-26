const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const materialSchema = new Schema({
  title: { type: String, required: true, trim: true },
  file: {
    storage: { type: String, enum: ["fs", "aws"], default: "fs" },
    fileId: { type: Schema.Types.Mixed, required: true },
    size: Number,
    mime: String
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "StaffAdmin", required: true },
  standardId: { type: Schema.Types.ObjectId, ref: "Standard" },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
  visibility: { type: String, enum: ["ALL", "STANDARD_ONLY", "SUBJECT_ONLY"], default: "STANDARD_ONLY" }
}, { timestamps: true });

materialSchema.plugin(softDeletePlugin);

module.exports = mongoose.model("Material", materialSchema);
