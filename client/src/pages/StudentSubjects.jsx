import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSubjects } from "../services/subjectService";
import { listAssignments, submitAssignment } from "../services/assignmentService";
import { useToast } from "../context/ToastContext";

export default function StudentSubjects() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [assignmentsBySubject, setAssignmentsBySubject] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!profile?.classroom) { setLoading(false); return; }
    const subs = await listSubjects(profile.classroom);
    setSubjects(subs);
    const map = {};
    for (const s of subs) {
      map[s._id] = await listAssignments(s._id);
    }
    setAssignmentsBySubject(map);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [profile]);

  async function handleSubmit(assignmentId, file) {
    if (!file) return;
    try {
      const result = await submitAssignment(assignmentId, file);
      if (result.xpResult) {
        showToast(`+${result.xpResult.xpAwarded} XP — submitted!`, "success");
      } else {
        showToast("Submitted (late — no XP awarded)", "");
      }
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Submission failed.", "error");
    }
  }

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar"><h1>Subjects</h1></div>
      {!profile?.classroom && (
        <div className="card"><div className="empty">You're not enrolled in a classroom yet. Ask your teacher for a join link.</div></div>
      )}
      {subjects.map((s) => (
        <div key={s._id}>
          <div className="section-label"><span>📘 {s.name} · {s.teacher?.name}</span></div>
          <div className="grouped" style={{ marginBottom: 12 }}>
            <div className="row">
              <div className="row-icon">📄</div>
              <div><div className="row-title">Syllabus</div><div className="row-sub">{s.syllabusUrl ? "Available" : "Not uploaded yet"}</div></div>
              <div className="row-right">{s.syllabusUrl && <a className="btn btn-outline btn-sm" href={s.syllabusUrl} target="_blank" rel="noreferrer">Download</a>}</div>
            </div>
            {s.materials.map((m, i) => (
              <div className="row" key={i}>
                <div className="row-icon">📎</div>
                <div><div className="row-title">{m.title}</div><div className="row-sub">Study material</div></div>
                <div className="row-right"><a className="btn btn-outline btn-sm" href={m.fileUrl} target="_blank" rel="noreferrer">Download</a></div>
              </div>
            ))}
          </div>
          <div className="grouped" style={{ marginBottom: 24 }}>
            {(assignmentsBySubject[s._id] || []).map((a) => (
              <AssignmentRow key={a._id} assignment={a} onSubmit={handleSubmit} />
            ))}
            {(assignmentsBySubject[s._id] || []).length === 0 && <div className="empty">No assignments posted yet.</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentRow({ assignment, onSubmit }) {
  const [file, setFile] = useState(null);
  const isPastDue = new Date() > new Date(assignment.dueDate);

  return (
    <div className="row">
      <div className="row-icon">📘</div>
      <div><div className="row-title">{assignment.title}</div><div className="row-sub">Due {new Date(assignment.dueDate).toLocaleDateString()}</div></div>
      <div className="row-right">
        <input type="file" style={{ maxWidth: 140, fontSize: 11 }} onChange={(e) => setFile(e.target.files[0])} />
        <button className="btn btn-primary btn-sm" disabled={!file} onClick={() => onSubmit(assignment._id, file)}>
          {isPastDue ? "Submit (late)" : "Submit"}
        </button>
      </div>
    </div>
  );
}
