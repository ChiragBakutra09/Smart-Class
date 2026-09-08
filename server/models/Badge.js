const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    earnedBadges: [
      {
        badgeId: String,
        earnedAt: { type: Date, default: Date.now },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
