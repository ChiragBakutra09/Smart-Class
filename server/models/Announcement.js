const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
