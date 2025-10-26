const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const mcqSchema = new Schema({
  standardId: { type: Schema.Types.ObjectId, ref: "Standard", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  question: {
    text: { type: String, required: true, trim: true },
    language: { type: String, enum: ["gu", "en"], default: "gu" },
    font: { type: String, enum: ["Nilkanth", "HareKrishna", "Default"], default: "Default" }
  },
  options: [{
    label: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],
  explanation: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "StaffAdmin", required: true }
}, { timestamps: true });

mcqSchema.plugin(softDeletePlugin);

// Validation: exactly one correct option
mcqSchema.pre("save", function (next) {
  const correctOptions = this.options.filter(o => o.isCorrect);
  if (correctOptions.length !== 1) {
    return next(new Error("Exactly one option must be marked as correct."));
  }
  next();
});

module.exports = mongoose.model("MCQ", mcqSchema);
