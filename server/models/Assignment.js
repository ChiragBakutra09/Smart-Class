const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
