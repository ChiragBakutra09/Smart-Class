const mongoose = require("mongoose");

const userXPSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xpHistory: [
      {
        action: String,
        xpAwarded: Number,
        refId: { type: mongoose.Schema.Types.ObjectId, default: null },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    loginStreak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastLoginDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserXP", userXPSchema);
