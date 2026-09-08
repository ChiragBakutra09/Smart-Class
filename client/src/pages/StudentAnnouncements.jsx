import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSubjects } from "../services/subjectService";
import { listAnnouncements, markAsRead } from "../services/announcementService";
import { useToast } from "../context/ToastContext";

export default function StudentAnnouncements() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!profile?.classroom) { setLoading(false); return; }
    const subjects = await listSubjects(profile.classroom);
    const all = [];
    for (const s of subjects) {
      const anns = await listAnnouncements(s._id);
      anns.forEach((a) => all.push({ ...a, subjectName: s.name }));
    }
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setItems(all);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  async function handleRead(id) {
    try {
      const result = await markAsRead(id);
      if (result.xpResult) showToast(`+${result.xpResult.xpAwarded} XP — announcement read`, "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not mark as read.", "error");
    }
  }

  if (loading) return <div className="center-page"><div className="spinner" /></div>;

  const isRead = (a) => a.readBy.some((r) => r.user === profile._id);

  return (
    <div>
      <div className="topbar"><h1>Announcements</h1></div>
      <div className="grouped">
        {items.length ? items.map((a) => (
          <div className="row" key={a._id}>
            <div className="row-icon">📢</div>
            <div><div className="row-title">{a.subjectName}</div><div className="row-sub">{a.message}</div></div>
            <div className="row-right">
              {isRead(a)
                ? <span className="badge-status graded">Read</span>
                : <button className="btn btn-primary btn-sm" onClick={() => handleRead(a._id)}>Mark as read</button>}
            </div>
          </div>
        )) : <div className="empty">No announcements yet.</div>}
      </div>
    </div>
  );
}
