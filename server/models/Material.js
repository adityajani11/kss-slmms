const mongoose = require("mongoose");
const { Schema } = mongoose;

const materialSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // File info (PDF stored in local FS or AWS)
    file: {
      storage: {
        type: String,
        enum: ["fs", "aws"],
        default: "fs",
      },
      fileId: {
        type: String, // path or S3 key
        required: true,
      },
      size: Number, // file size in bytes
      mime: {
        type: String,
        default: "application/pdf",
      },
    },

    // uploadedBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "StaffAdmin",
    //   required: true,
    // },

    // Associations
    standardId: {
      type: Schema.Types.ObjectId,
      ref: "Standard",
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
