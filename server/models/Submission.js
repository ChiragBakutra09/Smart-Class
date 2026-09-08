const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["on_time", "late"], required: true },
    isEarly: { type: Boolean, default: false },
    marks: { type: Number, default: null },
    feedback: { type: String, default: "" },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
