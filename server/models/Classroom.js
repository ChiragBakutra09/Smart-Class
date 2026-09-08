const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Classroom", classroomSchema);
