import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard } from "../services/xpService";

const LEVEL_NAMES = { 1: "Beginner", 2: "Learner", 3: "Achiever", 4: "Scholar", 5: "Master" };

export default function Leaderboard() {
  const { profile } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(profile?.classroom)
      .then(setBoard)
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar"><h1>Leaderboard</h1></div>
      <div className="grouped">
        {board.length ? board.map((s) => (
          <div className={"row" + (s.userId === profile._id ? " me" : "")} key={s.userId}>
            <div className={"rank-circle" + (s.rank === 1 ? " first" : "")}>{s.rank}</div>
            <div><div className="row-title">{s.name}{s.userId === profile._id ? " (you)" : ""}</div><div className="row-sub">Level {s.level} · {LEVEL_NAMES[s.level]}</div></div>
            <div className="row-right"><span className="row-value">{s.totalXP} XP</span></div>
          </div>
        )) : <div className="empty">No students in this classroom yet.</div>}
      </div>
    </div>
  );
}
