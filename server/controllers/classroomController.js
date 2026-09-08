const crypto = require("crypto");
const Classroom = require("../models/Classroom");
const Invite = require("../models/Invite");
const User = require("../models/User");
const Subject = require("../models/Subject");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Announcement = require("../models/Announcement");
const { parseRosterCSV } = require("../utils/csvParser");
const { sendClassInviteEmail } = require("../utils/emailService");

// POST /api/classrooms
async function createClassroom(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Classroom name is required." });

    const classroom = await Classroom.create({ name, createdBy: req.user._id });
    res.status(201).json({ classroom });
  } catch (err) {
    res.status(500).json({ message: "Could not create classroom.", error: err.message });
  }
}

// GET /api/classrooms
// FIX (bug #1): every teacher was seeing every OTHER teacher's classes too, because the
// frontend was reading a browser-local list instead of asking the server. This is the
// endpoint that was missing — it returns only classrooms *this* teacher created.
async function listMyClassrooms(req, res) {
  try {
    const classrooms = await Classroom.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ classrooms });
  } catch (err) {
    res.status(500).json({ message: "Could not list classrooms.", error: err.message });
  }
}

// DELETE /api/classrooms/:id
// FIX (bug #3): teachers had no way to delete a class. Cascades: removes the classroom's
// subjects, those subjects' assignments/submissions/announcements, all invites for the
// classroom, and un-links any students who had joined it (their account isn't deleted,
// just detached from this classroom).
async function deleteClassroom(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "Classroom not found." });
    if (String(classroom.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the teacher who created this class can delete it." });
    }

    const subjects = await Subject.find({ classroom: classroom._id });
    const subjectIds = subjects.map((s) => s._id);

    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const assignmentIds = assignments.map((a) => a._id);

    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ subject: { $in: subjectIds } });
    await Announcement.deleteMany({ subject: { $in: subjectIds } });
    await Subject.deleteMany({ classroom: classroom._id });
    await Invite.deleteMany({ classroom: classroom._id });
    await User.updateMany({ classroom: classroom._id }, { $set: { classroom: null } });
    await Classroom.deleteOne({ _id: classroom._id });

    res.json({ message: "Classroom and all related data deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete classroom.", error: err.message });
  }
}

// POST /api/classrooms/:id/roster/preview
async function previewRoster(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No CSV file uploaded." });
    const { valid, errors } = parseRosterCSV(req.file.buffer);
    res.json({ validCount: valid.length, errorCount: errors.length, valid, errors });
  } catch (err) {
    res.status(500).json({ message: "Could not parse roster CSV.", error: err.message });
  }
}

// POST /api/classrooms/:id/roster/confirm
async function confirmRoster(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "Classroom not found." });
    if (String(classroom.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the teacher who created this class can invite students." });
    }

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: "No students provided." });
    }

    const results = { created: [], skipped: [] };

    for (const s of students) {
      const existingInvite = await Invite.findOne({ classroom: classroom._id, email: s.email });
      if (existingInvite) {
        results.skipped.push({ email: s.email, reason: "Already invited to this class." });
        continue;
      }

      const token = crypto.randomBytes(24).toString("hex");
      const invite = await Invite.create({
        classroom: classroom._id,
        name: s.name,
        email: s.email,
        enrollmentNo: s.enrollmentNo,
        token,
      });

      const joinLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/join/${token}`;

      await sendClassInviteEmail({
        to: s.email,
        studentName: s.name,
        className: classroom.name,
        joinLink,
      });

      results.created.push({ email: s.email, inviteId: invite._id });
    }

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ message: "Could not send invites.", error: err.message });
  }
}

// GET /api/classrooms/join/:token  — public, shows invite info before login/register
async function getInviteByToken(req, res) {
  try {
    const invite = await Invite.findOne({ token: req.params.token }).populate("classroom", "name");
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite link." });
    if (invite.status === "joined") {
      return res.status(200).json({ alreadyJoined: true, classroomName: invite.classroom.name });
    }
    res.json({
      classroomName: invite.classroom.name,
      studentName: invite.name,
      email: invite.email,
      status: invite.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not look up invite.", error: err.message });
  }
}

// POST /api/classrooms/join/:token  — protected. This is the FIX for bug #2:
// an already-logged-in student (existing account) can now join directly, instead of
// the join link only working for brand-new registrations.
async function joinClassroomByToken(req, res) {
  try {
    const invite = await Invite.findOne({ token: req.params.token }).populate("classroom", "name");
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite link." });

    if (invite.status === "joined") {
      if (String(invite.joinedUser) === String(req.user._id)) {
        return res.status(200).json({ message: "Already joined.", classroom: invite.classroom });
      }
      return res.status(409).json({ message: "This invite has already been used by another account." });
    }

    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invite was sent to ${invite.email}, but you're logged in as ${req.user.email}. Log in with the invited email address instead.`,
      });
    }

    req.user.classroom = invite.classroom._id;
    if (invite.enrollmentNo && !req.user.enrollmentNo) req.user.enrollmentNo = invite.enrollmentNo;
    await req.user.save();

    invite.status = "joined";
    invite.joinedUser = req.user._id;
    invite.joinedAt = new Date();
    await invite.save();

    res.json({ message: "Joined classroom.", classroom: invite.classroom });
  } catch (err) {
    res.status(500).json({ message: "Could not join classroom.", error: err.message });
  }
}

// GET /api/classrooms/:id/roster
async function getRoster(req, res) {
  try {
    const invites = await Invite.find({ classroom: req.params.id }).sort({ invitedAt: -1 });
    const joinedCount = invites.filter((i) => i.status === "joined").length;
    res.json({ total: invites.length, joined: joinedCount, pending: invites.length - joinedCount, invites });
  } catch (err) {
    res.status(500).json({ message: "Could not load roster.", error: err.message });
  }
}

// POST /api/classrooms/:id/roster/:inviteId/resend
async function resendInvite(req, res) {
  try {
    const invite = await Invite.findById(req.params.inviteId).populate("classroom", "name");
    if (!invite) return res.status(404).json({ message: "Invite not found." });
    if (invite.status === "joined") return res.status(400).json({ message: "This student has already joined." });

    const joinLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/join/${invite.token}`;
    await sendClassInviteEmail({
      to: invite.email,
      studentName: invite.name,
      className: invite.classroom.name,
      joinLink,
    });
    res.json({ message: "Invite resent." });
  } catch (err) {
    res.status(500).json({ message: "Could not resend invite.", error: err.message });
  }
}

// DELETE /api/classrooms/:id/roster/:inviteId
// FIX (bug #3): "remove student" — works whether they're still pending or already joined.
// If joined, also detaches their account from the classroom (account itself isn't deleted).
async function removeStudent(req, res) {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: "Classroom not found." });
    if (String(classroom.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the teacher who created this class can remove students." });
    }

    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    if (invite.status === "joined" && invite.joinedUser) {
      await User.findByIdAndUpdate(invite.joinedUser, { $set: { classroom: null } });
    }
    await Invite.deleteOne({ _id: invite._id });

    res.json({ message: "Student removed from classroom." });
  } catch (err) {
    res.status(500).json({ message: "Could not remove student.", error: err.message });
  }
}

module.exports = {
  createClassroom,
  listMyClassrooms,
  deleteClassroom,
  previewRoster,
  confirmRoster,
  getInviteByToken,
  joinClassroomByToken,
  getRoster,
  resendInvite,
  removeStudent,
};
