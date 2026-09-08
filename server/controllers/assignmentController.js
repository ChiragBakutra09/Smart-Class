const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { awardXP, checkAndUnlockBadges } = require("../utils/xpEngine");

const XP_RULES = {
  SUBMIT_ON_TIME: 20,
  SUBMIT_EARLY_BONUS: 10,
  SCORE_ABOVE_AVERAGE: 15,
  SCORE_HIGHEST: 25,
};

async function createAssignment(req, res) {
  try {
    const { subjectId, title, description, dueDate, totalMarks } = req.body;
    if (!subjectId || !title || !dueDate) {
      return res.status(400).json({ message: "subjectId, title and dueDate are required." });
    }
    const assignment = await Assignment.create({
      subject: subjectId,
      title,
      description,
      dueDate,
      totalMarks: totalMarks || 100,
      fileUrl: req.file ? req.file.path : "",
      createdBy: req.user._id,
    });
    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: "Could not create assignment.", error: err.message });
  }
}

async function listAssignments(req, res) {
  try {
    const filter = req.query.subjectId ? { subject: req.query.subjectId } : {};
    const assignments = await Assignment.find(filter).sort({ dueDate: 1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: "Could not list assignments.", error: err.message });
  }
}

async function submitAssignment(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
    if (existing) return res.status(409).json({ message: "You have already submitted this assignment." });

    const now = new Date();
    const isOnTime = now <= new Date(assignment.dueDate);
    const daysEarly = (new Date(assignment.dueDate) - now) / (1000 * 60 * 60 * 24);

    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      fileUrl: req.file.path,
      status: isOnTime ? "on_time" : "late",
      isEarly: isOnTime && daysEarly >= 2,
    });

    let xpResult = null;
    if (isOnTime) {
      let xp = XP_RULES.SUBMIT_ON_TIME;
      if (daysEarly >= 2) xp += XP_RULES.SUBMIT_EARLY_BONUS;
      xpResult = await awardXP(req.user._id, "assignment_submit", xp, assignment._id);
      await checkAndUnlockBadges(req.user._id);
    }

    res.status(201).json({ submission, xpResult });
  } catch (err) {
    res.status(500).json({ message: "Could not submit assignment.", error: err.message });
  }
}

async function gradeSubmission(req, res) {
  try {
    const { marks, feedback } = req.body;
    if (typeof marks !== "number") return res.status(400).json({ message: "marks (number) is required." });

    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found." });

    submission.marks = marks;
    submission.feedback = feedback || "";
    submission.gradedAt = new Date();
    await submission.save();

    const allGraded = await Submission.find({
      assignment: submission.assignment,
      marks: { $ne: null },
    });
    const classAverage = allGraded.reduce((sum, s) => sum + s.marks, 0) / allGraded.length;
    const isHighest = allGraded.every((s) => s.marks <= marks);

    let xpResult = null;
    if (isHighest && allGraded.length > 1) {
      xpResult = await awardXP(submission.student, "score_highest", XP_RULES.SCORE_HIGHEST, submission.assignment);
    } else if (marks >= classAverage) {
      xpResult = await awardXP(submission.student, "score_above_average", XP_RULES.SCORE_ABOVE_AVERAGE, submission.assignment);
    }
    if (xpResult) await checkAndUnlockBadges(submission.student);

    res.json({ submission, classAverage: Math.round(classAverage * 10) / 10, xpResult });
  } catch (err) {
    res.status(500).json({ message: "Could not grade submission.", error: err.message });
  }
}

async function listSubmissionsForAssignment(req, res) {
  try {
    const submissions = await Submission.find({ assignment: req.params.id }).populate("student", "name email enrollmentNo");
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: "Could not list submissions.", error: err.message });
  }
}

module.exports = {
  createAssignment,
  listAssignments,
  submitAssignment,
  gradeSubmission,
  listSubmissionsForAssignment,
  XP_RULES,
};
