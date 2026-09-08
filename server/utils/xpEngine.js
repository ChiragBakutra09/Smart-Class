const UserXP = require("../models/UserXP");
const Badge = require("../models/Badge");
const Submission = require("../models/Submission");

const LEVELS = [
  { level: 1, name: "Beginner", min: 0 },
  { level: 2, name: "Learner", min: 100 },
  { level: 3, name: "Achiever", min: 300 },
  { level: 4, name: "Scholar", min: 700 },
  { level: 5, name: "Master", min: 1500 },
];

function computeLevel(totalXP) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (totalXP >= l.min) current = l;
  return current;
}

async function awardXP(userId, action, amount, refId = null) {
  if (amount <= 0) return null;

  let userXP = await UserXP.findOne({ user: userId });
  if (!userXP) {
    userXP = await UserXP.create({ user: userId });
  }

  const beforeLevel = computeLevel(userXP.totalXP);

  userXP.totalXP += amount;
  userXP.xpHistory.push({ action, xpAwarded: amount, refId, timestamp: new Date() });

  const afterLevel = computeLevel(userXP.totalXP);
  userXP.level = afterLevel.level;

  await userXP.save();

  return {
    xpAwarded: amount,
    totalXP: userXP.totalXP,
    level: afterLevel.level,
    levelName: afterLevel.name,
    leveledUp: afterLevel.level > beforeLevel.level,
  };
}

const BADGE_RULES = {
  early_bird: { need: 10 },
  on_a_roll: { need: 5 },
  in_loop: { need: 20 },
  consistent: { need: 30 },
};

async function checkAndUnlockBadges(userId) {
  const unlocked = [];
  let badgeDoc = await Badge.findOne({ user: userId });
  if (!badgeDoc) badgeDoc = await Badge.create({ user: userId, earnedBadges: [] });

  const has = (id) => badgeDoc.earnedBadges.some((b) => b.badgeId === id);
  const unlock = (id, subject = null) => {
    if (has(id)) return;
    badgeDoc.earnedBadges.push({ badgeId: id, subject });
    unlocked.push(id);
  };

  const userXP = await UserXP.findOne({ user: userId });
  const submissions = await Submission.find({ student: userId }).sort({ submittedAt: 1 });

  const earlyCount = submissions.filter((s) => s.isEarly).length;
  if (earlyCount >= BADGE_RULES.early_bird.need) unlock("early_bird");

  let roll = 0;
  for (const s of submissions) {
    roll = s.isEarly ? roll + 1 : 0;
  }
  if (roll >= BADGE_RULES.on_a_roll.need) unlock("on_a_roll");

  if (submissions.length > 0 && submissions.every((s) => s.status !== "late")) {
    unlock("perfect_attendance");
  }

  if (userXP) {
    const highestCount = userXP.xpHistory.filter((h) => h.action === "score_highest").length;
    if (highestCount >= 1) unlock("top_class");

    const readCount = userXP.xpHistory.filter((h) => h.action === "announcement_read").length;
    if (readCount >= BADGE_RULES.in_loop.need) unlock("in_loop");

    if (userXP.loginStreak?.best >= BADGE_RULES.consistent.need) unlock("consistent");
  }

  if (unlocked.length > 0) await badgeDoc.save();
  return unlocked;
}

module.exports = { awardXP, computeLevel, checkAndUnlockBadges, LEVELS, BADGE_RULES };
