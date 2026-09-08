const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "teacher", "student"], required: true },
    firebaseUID: { type: String, required: true, unique: true },
    enrollmentNo: { type: String, trim: true },
    profilePic: { type: String, default: "" },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
