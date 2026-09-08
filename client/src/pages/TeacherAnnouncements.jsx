import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSubjects } from "../services/subjectService";
import { createAnnouncement, editAnnouncement, deleteAnnouncement, listAnnouncements } from "../services/announcementService";
import { useToast } from "../context/ToastContext";

export default function TeacherAnnouncements() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSubjects() {
    const all = await listSubjects();
    const mine = all.filter((s) => s.teacher?._id === profile?._id || s.teacher === profile?._id);
    setSubjects(mine);
    if (mine.length && !subjectId) setSubjectId(mine[0]._id);
    setLoading(false);
  }

  async function loadAnnouncements(subId) {
    if (!subId) return;
    setItems(await listAnnouncements(subId));
  }

  useEffect(() => { if (profile) loadSubjects(); }, [profile]);
  useEffect(() => { loadAnnouncements(subjectId); }, [subjectId]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!message.trim() || !subjectId) return;
    try {
      await createAnnouncement(subjectId, message.trim());
      setMessage("");
      showToast("Announcement posted to students.", "success");
      loadAnnouncements(subjectId);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not post announcement.", "error");
    }
  }

  async function handleSaveEdit(id) {
    try {
      await editAnnouncement(id, editText);
      setEditingId(null);
      showToast("Announcement updated.", "success");
      loadAnnouncements(subjectId);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update.", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAnnouncement(id);
      showToast("Announcement deleted.", "success");
      loadAnnouncements(subjectId);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete.", "error");
    }
  }

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="topbar"><h1>Announcements</h1></div>

      <div className="form-card">
        <div className="section-label"><span>Post new announcement</span></div>
        <form onSubmit={handleCreate}>
          <div className="form-row" style={{ marginBottom: 10 }}>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1.5px solid var(--separator)" }}>
              {subjects.length === 0 && <option value="">Create a subject first</option>}
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <textarea placeholder="Write an announcement…" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="form-actions"><button className="btn btn-purple">Post announcement</button></div>
        </form>
      </div>

      <div className="grouped">
        {items.length ? items.map((a) => (
          <div className="row" key={a._id}>
            <div className="row-icon purple">📢</div>
            {editingId === a._id ? (
              <>
                <div style={{ flex: 1 }}>
                  <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1.5px solid var(--blue)" }} />
                </div>
                <div className="row-right"><button className="btn btn-purple btn-sm" onClick={() => handleSaveEdit(a._id)}>Save</button></div>
              </>
            ) : (
              <>
                <div><div className="row-title">{a.message}</div><div className="row-sub">{a.readBy.length} student(s) have read this</div></div>
                <div className="row-right">
                  <div className="row-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditingId(a._id); setEditText(a.message); }}>Edit</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(a._id)}>Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )) : <div className="empty">No announcements posted yet.</div>}
      </div>
    </div>
  );
}
