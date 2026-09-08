const initFirebaseAdmin = require("../config/firebaseAdmin");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "No auth token provided." });
    }

    const admin = initFirebaseAdmin();
    if (!admin) {
      return res.status(500).json({
        message: "Firebase Admin is not configured on the server. See server/.env.example.",
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUID: decoded.uid });
    if (!user) {
      return res.status(404).json({ message: "No matching user found for this account. Registration may be incomplete." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
}

module.exports = { protect, requireRole };
