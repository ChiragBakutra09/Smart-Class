const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { uploadFile } = require("../middleware/upload");
const {
  createAssignment, listAssignments, submitAssignment,
  gradeSubmission, listSubmissionsForAssignment,
} = require("../controllers/assignmentController");

router.get("/", protect, listAssignments);
router.post("/", protect, requireRole("teacher"), uploadFile.single("file"), createAssignment);
router.post("/:id/submit", protect, requireRole("student"), uploadFile.single("file"), submitAssignment);
router.get("/:id/submissions", protect, requireRole("teacher"), listSubmissionsForAssignment);
router.post("/submissions/:submissionId/grade", protect, requireRole("teacher"), gradeSubmission);

module.exports = router;
