import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSubjects } from "../services/subjectService";
import { listAssignments, listSubmissions } from "../services/assignmentService";

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const subs = await listSubjects();
      const mine = subs.filter((s) => s.teacher?._id === profile?._id || s.teacher === profile?._id);
      setSubjects(mine);

      const allAssignments = [];
      const allPending = [];
      for (const s of mine) {
        const assignments = await listAssignments(s._id);
        assignments.forEach((a) => allAssignments.push({ ...a, subjectName: s.name }));
        for (const a of assignments) {
          const subs2 = await listSubmissions(a._id);
          subs2.filter((sub) => sub.marks === null).forEach((sub) =>
            allPending.push({ ...sub, assignmentTitle: a.title, subjectName: s.name })
          );
        }
      }
      setRecentAssignments(allAssignments.slice(0, 5));
      setPendingReview(allPending.slice(0, 5));
      setLoading(false);
    }
    if (profile) load();
  }, [profile]);

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar">
        <div><div className="greet">Hi {profile?.name} 👋</div><h1>Dashboard</h1></div>
      </div>

      <div className="grid3">
        <div className="stat-mini"><div className="lbl">Subjects taught</div><div className="val">{subjects.length}</div></div>
        <div className="stat-mini"><div className="lbl">Pending review</div><div className="val">{pendingReview.length}</div></div>
        <div className="stat-mini"><div className="lbl">Total assignments</div><div className="val">{recentAssignments.length}</div></div>
      </div>

      <div className="grid2">
        <div>
          <div className="section-label"><span>Recent assignments</span></div>
          <div className="grouped">
            {recentAssignments.length ? recentAssignments.map((a) => (
              <div className="row" key={a._id}>
                <div className="row-icon purple">📘</div>
                <div><div className="row-title">{a.title}</div><div className="row-sub">{a.subjectName} · Due {new Date(a.dueDate).toLocaleDateString()}</div></div>
              </div>
            )) : <div className="empty">No assignments created yet.</div>}
          </div>
        </div>
        <div>
          <div className="section-label"><span>Submissions awaiting review</span></div>
          <div className="grouped">
            {pendingReview.length ? pendingReview.map((s) => (
              <div className="row" key={s._id}>
                <div className="row-icon purple">📝</div>
                <div><div className="row-title">{s.student?.name} — {s.assignmentTitle}</div><div className="row-sub">{s.subjectName} · {s.status === "on_time" ? "On time" : "Late"}</div></div>
              </div>
            )) : <div className="empty">Nothing pending — all caught up.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
