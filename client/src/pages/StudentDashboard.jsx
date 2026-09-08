import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyXP, recordDailyLogin, getLeaderboard } from "../services/xpService";
import { listSubjects } from "../services/subjectService";
import { listAssignments } from "../services/assignmentService";

const LEVELS = [
  { level: 1, name: "Beginner", min: 0 },
  { level: 2, name: "Learner", min: 100 },
  { level: 3, name: "Achiever", min: 300 },
  { level: 4, name: "Scholar", min: 700 },
  { level: 5, name: "Master", min: 1500 },
];
const ROMAN = ["", "I", "II", "III", "IV", "V"];

function computeLevel(xp) {
  let lv = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) lv = l;
  return lv;
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [xp, setXp] = useState(null);
  const [rank, setRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        await recordDailyLogin();
        const xpData = await getMyXP();
        setXp(xpData.xp);
        setBadgeCount(xpData.badges.length);

        const board = await getLeaderboard(profile?.classroom);
        const idx = board.findIndex((b) => b.userId === profile?._id);
        setRank(idx >= 0 ? idx + 1 : null);
        setTotalStudents(board.length);

        if (profile?.classroom) {
          const subjects = await listSubjects(profile.classroom);
          const all = [];
          for (const s of subjects) {
            const assignments = await listAssignments(s._id);
            assignments.forEach((a) => all.push({ ...a, subjectName: s.name, subjectIcon: "📘" }));
          }
          setUpcoming(all.slice(0, 5));
        }
      } catch (err) {
        setError("Could not load dashboard data. Is the backend running and your .env configured?");
        console.error(err);
      }
    }
    if (profile) load();
  }, [profile]);

  const totalXP = xp?.totalXP || 0;
  const lv = computeLevel(totalXP);
  const nextLv = LEVELS[lv.level] || null;
  const pct = nextLv ? Math.min(100, ((totalXP - lv.min) / (nextLv.min - lv.min)) * 100) : 100;

  return (
    <div>
      <div className="topbar">
        <div><div className="greet">Hi {profile?.name?.split(" ")[0] || "there"} 👋</div><h1>Dashboard</h1></div>
        <div className="streak-chip">🔥 {xp?.loginStreak?.current || 0}-day streak</div>
      </div>

      {!profile?.classroom && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="empty">You're not enrolled in a classroom yet. Ask your teacher for a join link.</div>
        </div>
      )}
      {error && <div className="card" style={{ marginBottom: 20 }}><span className="error-text">{error}</span></div>}

      <div className="grid2">
        <div className="level-card">
          <div className="row-top">
            <div>
              <div className="lvl-name">Level {lv.level} · {lv.name}</div>
              <div className="lvl-sub">{nextLv ? `${nextLv.min - totalXP} XP to ${nextLv.name}` : "Max level reached"}</div>
            </div>
            <div className="level-badge-circle">{ROMAN[lv.level]}</div>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: pct + "%" }} /></div>
          <div className="xp-caption"><span>{totalXP} XP</span><span>{nextLv ? nextLv.min + " XP" : "—"}</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="stat-mini"><div className="lbl">Classroom rank</div><div className="val">{rank ? `#${rank}` : "—"} <span style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>of {totalStudents}</span></div></div>
          <div className="stat-mini"><div className="lbl">Badges earned</div><div className="val">{badgeCount} of 6</div></div>
        </div>
      </div>

      <div>
        <div className="section-label"><span>Upcoming assignments</span></div>
        <div className="grouped">
          {upcoming.length ? upcoming.map((a) => (
            <div className="row" key={a._id}>
              <div className="row-icon">{a.subjectIcon}</div>
              <div><div className="row-title">{a.subjectName} — {a.title}</div><div className="row-sub">Due {new Date(a.dueDate).toLocaleDateString()}</div></div>
            </div>
          )) : <div className="empty">All caught up — no pending assignments.</div>}
        </div>
      </div>
    </div>
  );
}
