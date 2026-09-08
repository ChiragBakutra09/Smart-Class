const Subject = require("../models/Subject");
const Classroom = require("../models/Classroom");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Announcement = require("../models/Announcement");

// POST /api/subjects  { name, classroomId }
async function createSubject(req, res) {
  try {
    const { name, classroomId } = req.body;
    if (!name || !classroomId) return res.status(400).json({ message: "name and classroomId are required." });

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found." });
    if (String(classroom.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only create subjects in your own classrooms." });
    }

    const subject = await Subject.create({ name, classroom: classroomId, teacher: req.user._id });
    await Classroom.findByIdAndUpdate(classroomId, { $push: { subjects: subject._id } });

    res.status(201).json({ subject });
  } catch (err) {
    res.status(500).json({ message: "Could not create subject.", error: err.message });
  }
}

// GET /api/subjects?classroomId=...
async function listSubjects(req, res) {
  try {
    const filter = req.query.classroomId ? { classroom: req.query.classroomId } : {};
    const subjects = await Subject.find(filter).populate("teacher", "name email");
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: "Could not list subjects.", error: err.message });
  }
}

// DELETE /api/subjects/:id
// FIX (bug #3): teachers had no way to delete a subject. Cascades to that subject's
// assignments, submissions, and announcements.
async function deleteSubject(req, res) {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found." });
    if (String(subject.teacher) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own subjects." });
    }

    const assignments = await Assignment.find({ subject: subject._id });
    const assignmentIds = assignments.map((a) => a._id);

    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ subject: subject._id });
    await Announcement.deleteMany({ subject: subject._id });
    await Classroom.updateOne({ _id: subject.classroom }, { $pull: { subjects: subject._id } });
    await Subject.deleteOne({ _id: subject._id });

    res.json({ message: "Subject and all related data deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete subject.", error: err.message });
  }
}

// POST /api/subjects/:id/syllabus
async function uploadSyllabus(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { syllabusUrl: req.file.path },
      { new: true }
    );
    res.json({ subject });
  } catch (err) {
    res.status(500).json({ message: "Could not upload syllabus.", error: err.message });
  }
}

// POST /api/subjects/:id/materials
async function uploadMaterial(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    subject.materials.push({ title: req.body.title || req.file.originalname, fileUrl: req.file.path });
    await subject.save();

    res.status(201).json({ subject });
  } catch (err) {
    res.status(500).json({ message: "Could not upload material.", error: err.message });
  }
}

module.exports = { createSubject, listSubjects, deleteSubject, uploadSyllabus, uploadMaterial };
