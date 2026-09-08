const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { uploadCSV } = require("../middleware/upload");
const {
  createClassroom, listMyClassrooms, deleteClassroom,
  previewRoster, confirmRoster,
  getInviteByToken, joinClassroomByToken,
  getRoster, resendInvite, removeStudent,
} = require("../controllers/classroomController");

// Public — a student sees invite details before logging in
router.get("/join/:token", getInviteByToken);
// Protected — an already-logged-in student joins with one click (fixes bug #2)
router.post("/join/:token", protect, requireRole("student"), joinClassroomByToken);

router.get("/", protect, requireRole("teacher", "admin"), listMyClassrooms);
router.post("/", protect, requireRole("teacher", "admin"), createClassroom);
router.delete("/:id", protect, requireRole("teacher", "admin"), deleteClassroom);
router.post("/:id/roster/preview", protect, requireRole("teacher", "admin"), uploadCSV.single("file"), previewRoster);
router.post("/:id/roster/confirm", protect, requireRole("teacher", "admin"), confirmRoster);
router.get("/:id/roster", protect, requireRole("teacher", "admin"), getRoster);
router.post("/:id/roster/:inviteId/resend", protect, requireRole("teacher", "admin"), resendInvite);
router.delete("/:id/roster/:inviteId", protect, requireRole("teacher", "admin"), removeStudent);

module.exports = router;
