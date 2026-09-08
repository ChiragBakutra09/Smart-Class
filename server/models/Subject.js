const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    syllabusUrl: { type: String, default: "" },
    materials: [
      {
        title: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
