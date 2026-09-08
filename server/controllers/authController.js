const initFirebaseAdmin = require("../config/firebaseAdmin");
const User = require("../models/User");
const UserXP = require("../models/UserXP");
const Invite = require("../models/Invite");

// POST /api/auth/register
async function register(req, res) {
  try {
    const admin = initFirebaseAdmin();
    if (!admin) return res.status(500).json({ message: "Firebase Admin not configured." });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "No auth token provided." });

    const decoded = await admin.auth().verifyIdToken(token);

    const existing = await User.findOne({ firebaseUID: decoded.uid });
    if (existing) return res.status(200).json({ user: existing });

    const { name, role, inviteToken } = req.body;
    if (!name || !role) return res.status(400).json({ message: "name and role are required." });

    let classroom = null;
    let enrollmentNo = undefined;

    if (inviteToken) {
      const invite = await Invite.findOne({ token: inviteToken, status: "invited" });
      if (invite) {
        classroom = invite.classroom;
        enrollmentNo = invite.enrollmentNo;
      }
    }

    const user = await User.create({
      name,
      email: decoded.email,
      role,
      firebaseUID: decoded.uid,
      classroom,
      enrollmentNo,
    });

    if (role === "student") {
      await UserXP.create({ user: user._id });
    }

    if (inviteToken && classroom) {
      await Invite.updateOne(
        { token: inviteToken },
        { status: "joined", joinedUser: user._id, joinedAt: new Date() }
      );
    }

    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, getMe };
