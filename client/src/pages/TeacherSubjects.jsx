import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listMyClassrooms } from "../services/classroomService";
import { createSubject, listSubjects, deleteSubject, uploadSyllabus, uploadMaterial } from "../services/subjectService";
import { useToast } from "../context/ToastContext";

// FIX (bug #1, continued): this page also used to read classrooms from localStorage —
// same bug as My Classes. Now it fetches your actual classrooms from the backend.
export default function TeacherSubjects() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [myClassrooms, allSubjects] = await Promise.all([listMyClassrooms(), listSubjects()]);
    setClassrooms(myClassrooms);
    if (myClassrooms.length && !classroomId) setClassroomId(myClassrooms[0]._id);
    setSubjects(allSubjects.filter((s) => s.teacher?._id === profile?._id || s.teacher === profile?._id));
    setLoading(false);
  }

  useEffect(() => { if (profile) load(); }, [profile]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !classroomId) {
      showToast("Enter a subject name and create a class first.", "error");
      return;
    }
    try {
      await createSubject(name.trim(), classroomId);
      setName("");
      showToast("Subject created.", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not create subject.", "error");
    }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Delete "${subject.name}"? This removes its assignments, submissions, and announcements too.`)) return;
    try {
      await deleteSubject(subject._id);
      showToast("Subject deleted.", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete subject.", "error");
    }
  }

  async function handleSyllabus(subjectId, file) {
    if (!file) return;
    try {
      await uploadSyllabus(subjectId, file);
      showToast("Syllabus uploaded.", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed.", "error");
    }
  }

  async function handleMaterial(subjectId, file) {
    if (!file) return;
    try {
      await uploadMaterial(subjectId, file, file.name);
      showToast("Material uploaded — visible to students now.", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed.", "error");
    }
  }

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar"><h1>Subjects</h1></div>

      <div className="form-card">
        <div className="section-label"><span>Create a subject</span></div>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input type="text" placeholder="Subject name, e.g. Java" value={name} onChange={(e) => setName(e.target.value)} />
            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1.5px solid var(--separator)" }}>
              {classrooms.length === 0 && <option value="">No classes yet — create one first</option>}
              {classrooms.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <button className="btn btn-purple">Create subject</button>
          </div>
        </form>
      </div>

      {subjects.map((s) => (
        <div key={s._id} style={{ marginBottom: 20 }}>
          <div className="section-label">
            <span>📘 {s.name}</span>
            <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(s)}>Delete subject</button>
          </div>
          <div className="grouped">
            <div className="row">
              <div className="row-icon purple">📄</div>
              <div><div className="row-title">Syllabus</div><div className="row-sub">{s.syllabusUrl ? "Uploaded" : "Not uploaded"}</div></div>
              <div className="row-right"><input type="file" style={{ maxWidth: 160, fontSize: 11 }} onChange={(e) => handleSyllabus(s._id, e.target.files[0])} /></div>
            </div>
            {s.materials.map((m, i) => (
              <div className="row" key={i}>
                <div className="row-icon purple">📎</div>
                <div><div className="row-title">{m.title}</div><div className="row-sub">Study material</div></div>
              </div>
            ))}
            <div className="row">
              <div className="row-icon purple">➕</div>
              <div><div className="row-title">Upload new material</div></div>
              <div className="row-right"><input type="file" style={{ maxWidth: 160, fontSize: 11 }} onChange={(e) => handleMaterial(s._id, e.target.files[0])} /></div>
            </div>
          </div>
        </div>
      ))}
      {subjects.length === 0 && <div className="grouped"><div className="empty">No subjects yet — create one above.</div></div>}
    </div>
  );
}
