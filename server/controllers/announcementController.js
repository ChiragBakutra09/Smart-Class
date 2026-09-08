const Announcement = require("../models/Announcement");
const { awardXP, checkAndUnlockBadges } = require("../utils/xpEngine");

const XP_ANNOUNCEMENT_READ = 2;
const READ_WINDOW_HOURS = 24;

async function createAnnouncement(req, res) {
  try {
    const { subjectId, message } = req.body;
    if (!subjectId || !message) return res.status(400).json({ message: "subjectId and message are required." });

    const announcement = await Announcement.create({ subject: subjectId, postedBy: req.user._id, message });
    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ message: "Could not create announcement.", error: err.message });
  }
}

async function editAnnouncement(req, res) {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      { message: req.body.message },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ message: "Announcement not found or not yours." });
    res.json({ announcement });
  } catch (err) {
    res.status(500).json({ message: "Could not edit announcement.", error: err.message });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const result = await Announcement.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!result) return res.status(404).json({ message: "Announcement not found or not yours." });
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete announcement.", error: err.message });
  }
}

async function listAnnouncements(req, res) {
  try {
    const filter = req.query.subjectId ? { subject: req.query.subjectId } : {};
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: "Could not list announcements.", error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found." });

    const alreadyRead = announcement.readBy.some((r) => String(r.user) === String(req.user._id));
    if (alreadyRead) return res.status(200).json({ message: "Already marked as read.", xpResult: null });

    announcement.readBy.push({ user: req.user._id, readAt: new Date() });
    await announcement.save();

    const hoursSincePosted = (Date.now() - announcement.createdAt.getTime()) / (1000 * 60 * 60);
    let xpResult = null;
    if (hoursSincePosted <= READ_WINDOW_HOURS) {
      xpResult = await awardXP(req.user._id, "announcement_read", XP_ANNOUNCEMENT_READ, announcement._id);
      await checkAndUnlockBadges(req.user._id);
    }

    res.json({ message: "Marked as read.", xpResult });
  } catch (err) {
    res.status(500).json({ message: "Could not mark announcement as read.", error: err.message });
  }
}

module.exports = { createAnnouncement, editAnnouncement, deleteAnnouncement, listAnnouncements, markAsRead };
