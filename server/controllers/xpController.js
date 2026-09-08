const UserXP = require("../models/UserXP");
const Badge = require("../models/Badge");
const User = require("../models/User");
const { awardXP, checkAndUnlockBadges } = require("../utils/xpEngine");

const STREAK_MILESTONES = { 5: 20, 10: 50, 30: 150 };
const DAILY_LOGIN_XP = 5;

async function getMyXP(req, res) {
  try {
    const userXP = await UserXP.findOne({ user: req.user._id });
    const badgeDoc = await Badge.findOne({ user: req.user._id });
    res.json({ xp: userXP || null, badges: badgeDoc ? badgeDoc.earnedBadges : [] });
  } catch (err) {
    res.status(500).json({ message: "Could not load XP.", error: err.message });
  }
}

async function recordDailyLogin(req, res) {
  try {
    let userXP = await UserXP.findOne({ user: req.user._id });
    if (!userXP) userXP = await UserXP.create({ user: req.user._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = userXP.loginStreak.lastLoginDate ? new Date(userXP.loginStreak.lastLoginDate) : null;
    if (last) last.setHours(0, 0, 0, 0);

    if (last && last.getTime() === today.getTime()) {
      return res.json({ message: "Already recorded today.", streak: userXP.loginStreak });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (last && last.getTime() === yesterday.getTime()) {
      userXP.loginStreak.current += 1;
    } else {
      userXP.loginStreak.current = 1;
    }
    if (userXP.loginStreak.current > userXP.loginStreak.best) {
      userXP.loginStreak.best = userXP.loginStreak.current;
    }
    userXP.loginStreak.lastLoginDate = today;
    await userXP.save();

    const xpResult = await awardXP(req.user._id, "login_streak", DAILY_LOGIN_XP, null);

    let milestoneResult = null;
    const bonus = STREAK_MILESTONES[userXP.loginStreak.current];
    if (bonus) {
      milestoneResult = await awardXP(req.user._id, "login_streak_milestone", bonus, null);
    }
    await checkAndUnlockBadges(req.user._id);

    res.json({ streak: userXP.loginStreak, xpResult, milestoneResult });
  } catch (err) {
    res.status(500).json({ message: "Could not record login.", error: err.message });
  }
}

async function getLeaderboard(req, res) {
  try {
    const filter = { role: "student" };
    if (req.query.classroomId) filter.classroom = req.query.classroomId;

    const students = await User.find(filter).select("_id name");
    const ids = students.map((s) => s._id);

    const xpDocs = await UserXP.find({ user: { $in: ids } });
    const xpByUser = Object.fromEntries(xpDocs.map((x) => [String(x.user), x]));

    const leaderboard = students
      .map((s) => ({
        userId: s._id,
        name: s.name,
        totalXP: xpByUser[String(s._id)]?.totalXP || 0,
        level: xpByUser[String(s._id)]?.level || 1,
      }))
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((row, i) => ({ rank: i + 1, ...row }));

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ message: "Could not load leaderboard.", error: err.message });
  }
}

module.exports = { getMyXP, recordDailyLogin, getLeaderboard };
