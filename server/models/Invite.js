const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    enrollmentNo: { type: String, trim: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["invited", "joined", "expired"], default: "invited" },
    joinedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    invitedAt: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inviteSchema.index({ classroom: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Invite", inviteSchema);
