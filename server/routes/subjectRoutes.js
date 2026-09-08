const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const { uploadFile } = require("../middleware/upload");
const { createSubject, listSubjects, deleteSubject, uploadSyllabus, uploadMaterial } = require("../controllers/subjectController");

router.get("/", protect, listSubjects);
router.post("/", protect, requireRole("teacher", "admin"), createSubject);
router.delete("/:id", protect, requireRole("teacher", "admin"), deleteSubject);
router.post("/:id/syllabus", protect, requireRole("teacher"), uploadFile.single("file"), uploadSyllabus);
router.post("/:id/materials", protect, requireRole("teacher"), uploadFile.single("file"), uploadMaterial);

module.exports = router;
