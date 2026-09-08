import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyXP } from "../services/xpService";

const LEVELS = [
  { level: 1, name: "Beginner", min: 0 }, { level: 2, name: "Learner", min: 100 },
  { level: 3, name: "Achiever", min: 300 }, { level: 4, name: "Scholar", min: 700 }, { level: 5, name: "Master", min: 1500 },
];
function computeLevel(xp) { let lv = LEVELS[0]; for (const l of LEVELS) if (xp >= l.min) lv = l; return lv; }

const BADGE_DEFS = [
  { id: "early_bird", icon: "🐦", name: "Early Bird" },
  { id: "on_a_roll", icon: "🔥", name: "On a Roll" },
  { id: "top_class", icon: "🏆", name: "Top of the Class" },
  { id: "in_loop", icon: "📢", name: "In the Loop" },
  { id: "consistent", icon: "📅", name: "Consistent" },
  { id: "perfect_attendance", icon: "🎯", name: "Perfect Attendance" },
];

export default function StudentProfile() {
  const { profile } = useAuth();
  const [xp, setXp] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    getMyXP().then((data) => { setXp(data.xp); setBadges(data.badges); });
  }, []);

  const totalXP = xp?.totalXP || 0;
  const lv = computeLevel(totalXP);
  const nextLv = LEVELS[lv.level] || null;
  const pct = nextLv ? Math.min(100, ((totalXP - lv.min) / (nextLv.min - lv.min)) * 100) : 100;
  const initials = profile?.name ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("") : "S";
  const earnedIds = badges.map((b) => b.badgeId);

  return (
    <div>
      <div className="topbar"><h1>Profile</h1></div>
      <div className="card">
        <div className="profile-head">
          <div className="avatar-lg">{initials}</div>
          <div><h2>{profile?.name}</h2><div className="sub">{profile?.email}</div></div>
        </div>
        <div className="progress-track" style={{ background: "var(--blue-tint)" }}><div className="progress-fill" style={{ width: pct + "%", background: "var(--blue)" }} /></div>
        <div className="xp-caption" style={{ color: "var(--text-2)", opacity: 1 }}><span>{totalXP} XP</span><span>{nextLv ? `${nextLv.min} XP for Level ${nextLv.level}` : "Max level"}</span></div>
      </div>

      <div className="grid3" style={{ marginTop: 20 }}>
        <div className="stat-mini"><div className="lbl">Best streak</div><div className="val">🔥 {xp?.loginStreak?.best || 0} days</div></div>
        <div className="stat-mini"><div className="lbl">Current streak</div><div className="val">{xp?.loginStreak?.current || 0} days</div></div>
        <div className="stat-mini"><div className="lbl">Level</div><div className="val">{lv.level} · {lv.name}</div></div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-label"><span>Badges</span></div>
        <div className="badge-grid">
          {BADGE_DEFS.map((b) => {
            const unlocked = earnedIds.includes(b.id);
            return (
              <div className="badge-wrap" key={b.id}>
                <div className={"badge-circle" + (unlocked ? "" : " locked")}>{b.icon}</div>
                <div className="badge-label">{b.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
