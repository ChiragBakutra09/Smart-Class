import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSubjects } from "../services/subjectService";
import { createAssignment, listAssignments, listSubmissions, gradeSubmission } from "../services/assignmentService";
import { useToast } from "../context/ToastContext";

export default function TeacherAssignments() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadSubjects() {
    const all = await listSubjects();
    const mine = all.filter((s) => s.teacher?._id === profile?._id || s.teacher === profile?._id);
    setSubjects(mine);
    if (mine.length && !subjectId) setSubjectId(mine[0]._id);
    setLoading(false);
  }

  async function loadAssignments(subId) {
    if (!subId) return;
    const list = await listAssignments(subId);
    setAssignments(list);
  }

  useEffect(() => { if (profile) loadSubjects(); }, [profile]);
  useEffect(() => { loadAssignments(subjectId); }, [subjectId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !dueDate || !subjectId) {
      showToast("Fill in a title, due date, and subject.", "error");
      return;
    }
    try {
      await createAssignment({ subjectId, title: title.trim(), dueDate }, null);
      setTitle(""); setDueDate("");
      showToast("Assignment published to students.", "success");
      loadAssignments(subjectId);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not create assignment.", "error");
    }
  }

  async function toggleExpand(assignmentId) {
    if (expanded === assignmentId) { setExpanded(null); return; }
    const subs = await listSubmissions(assignmentId);
    setSubmissions((s) => ({ ...s, [assignmentId]: subs }));
    setExpanded(assignmentId);
  }

  async function handleGrade(submissionId, marks) {
    try {
      const result = await gradeSubmission(submissionId, Number(marks), "");
      showToast(
        result.xpResult ? `Graded — student earned +${result.xpResult.xpAwarded} XP` : "Graded (below class average — no bonus XP)",
        "success"
      );
      const subs = await listSubmissions(expanded);
      setSubmissions((s) => ({ ...s, [expanded]: subs }));
    } catch (err) {
      showToast(err.response?.data?.message || "Could not grade submission.", "error");
    }
  }

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar"><h1>Assignments</h1></div>

      <div className="form-card">
        <div className="section-label"><span>Create new assignment</span></div>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1.5px solid var(--separator)" }}>
              {subjects.length === 0 && <option value="">Create a subject first</option>}
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input type="text" placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ maxWidth: 160 }} />
            <button className="btn btn-purple">Create &amp; publish</button>
          </div>
        </form>
      </div>

      <div className="grouped">
        {assignments.length ? assignments.map((a) => (
          <div key={a._id}>
            <div className="row">
              <div className="row-icon purple">📘</div>
              <div><div className="row-title">{a.title}</div><div className="row-sub">Due {new Date(a.dueDate).toLocaleDateString()}</div></div>
              <div className="row-right"><button className="btn btn-outline btn-sm" onClick={() => toggleExpand(a._id)}>{expanded === a._id ? "Hide" : "View submissions"}</button></div>
            </div>
            {expanded === a._id && (
              <div style={{ background: "#FAFAFB", padding: "8px 18px 16px 60px" }}>
                {(submissions[a._id] || []).length ? submissions[a._id].map((s) => (
                  <SubmissionRow key={s._id} submission={s} onGrade={handleGrade} />
                )) : <div className="empty">No submissions yet.</div>}
              </div>
            )}
          </div>
        )) : <div className="empty">No assignments yet — create one above.</div>}
      </div>
    </div>
  );
}

function SubmissionRow({ submission, onGrade }) {
  const [marks, setMarks] = useState(submission.marks ?? "");
  return (
    <div className="row" style={{ background: "#fff", borderRadius: 12, marginTop: 8 }}>
      <div className="row-icon">👤</div>
      <div><div className="row-title">{submission.student?.name}</div><div className="row-sub">{submission.status === "on_time" ? "On time" : "Late"}</div></div>
      <div className="row-right">
        <a className="btn btn-outline btn-sm" href={submission.fileUrl} target="_blank" rel="noreferrer">📄 View submission</a>
        <input type="number" min="0" max="100" placeholder="Marks" value={marks} onChange={(e) => setMarks(e.target.value)} style={{ width: 70, padding: 8, borderRadius: 8, border: "1.5px solid var(--separator)" }} />
        <button className="btn btn-purple btn-sm" disabled={marks === ""} onClick={() => onGrade(submission._id, marks)}>Save marks</button>
      </div>
    </div>
  );
}
