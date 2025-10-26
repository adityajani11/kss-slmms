const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.plugin(softDeletePlugin);

module.exports = mongoose.model("Category", categorySchema);
