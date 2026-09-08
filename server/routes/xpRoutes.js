const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getMyXP, recordDailyLogin, getLeaderboard } = require("../controllers/xpController");

router.get("/me", protect, getMyXP);
router.post("/login-streak", protect, recordDailyLogin);
router.get("/leaderboard", protect, getLeaderboard);

module.exports = router;
