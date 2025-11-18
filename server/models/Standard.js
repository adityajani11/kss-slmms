const mongoose = require("mongoose");
const { Schema } = mongoose;
const softDeletePlugin = require("./plugins/softDelete");

const standardSchema = new Schema(
  {
    standard: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

standardSchema.plugin(softDeletePlugin);

module.exports = mongoose.model("Standard", standardSchema);
