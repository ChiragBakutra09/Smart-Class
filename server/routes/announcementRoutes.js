const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
  createAnnouncement, editAnnouncement, deleteAnnouncement,
  listAnnouncements, markAsRead,
} = require("../controllers/announcementController");

router.get("/", protect, listAnnouncements);
router.post("/", protect, requireRole("teacher"), createAnnouncement);
router.put("/:id", protect, requireRole("teacher"), editAnnouncement);
router.delete("/:id", protect, requireRole("teacher"), deleteAnnouncement);
router.post("/:id/read", protect, requireRole("student"), markAsRead);

module.exports = router;
