import { useEffect, useState } from "react";
import {
  listMyClassrooms, createClassroom, deleteClassroom,
  previewRoster, confirmRoster, getRoster, resendInvite, removeStudent,
} from "../services/classroomService";
import { useToast } from "../context/ToastContext";

// FIX (bug #1): this used to read/write a browser-local list (localStorage), which is
// why a brand-new teacher account could see classes created by a totally different
// teacher on the same browser/machine. It now always asks the backend for classrooms
// created by *this* logged-in teacher specifically (server filters by req.user._id).
export default function TeacherClasses() {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("list");
  const [className, setClassName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadClassrooms() {
    setLoading(true);
    try {
      const data = await listMyClassrooms();
      setClassrooms(data);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not load your classes.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClassrooms(); }, []);

  async function handleCreateClass(e) {
    e.preventDefault();
    if (!className.trim()) return;
    setLoading(true);
    try {
      const classroom = await createClassroom(className.trim());
      setClassrooms((c) => [classroom, ...c]);
      setSelected(classroom);
      setClassName("");
      setStep("upload");
      showToast("Classroom created — now upload your student roster.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not create classroom.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClass(classroom) {
    if (!window.confirm(`Delete "${classroom.name}"? This removes all its subjects, assignments, and invites. This can't be undone.`)) return;
    try {
      await deleteClassroom(classroom._id);
      setClassrooms((c) => c.filter((x) => x._id !== classroom._id));
      showToast("Classroom deleted.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete classroom.", "error");
    }
  }

  async function handlePreview() {
    if (!file || !selected) return;
    setLoading(true);
    try {
      const data = await previewRoster(selected._id, file);
      setPreview(data);
      setStep("preview");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not parse CSV.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview?.valid?.length || !selected) return;
    setLoading(true);
    try {
      const result = await confirmRoster(selected._id, preview.valid);
      showToast(`Invited ${result.created.length} student(s) — join links emailed.`, "success");
      await loadRoster(selected._id);
      setStep("roster");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not send invites.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoster(classroomId) {
    const data = await getRoster(classroomId);
    setRoster(data);
  }

  async function handleResend(inviteId) {
    try {
      await resendInvite(selected._id, inviteId);
      showToast("Invite resent.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not resend invite.", "error");
    }
  }

  async function handleRemoveStudent(invite) {
    if (!window.confirm(`Remove ${invite.name} from this class?`)) return;
    try {
      await removeStudent(selected._id, invite._id);
      showToast("Student removed.", "success");
      loadRoster(selected._id);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not remove student.", "error");
    }
  }

  function viewRoster(classroom) {
    setSelected(classroom);
    loadRoster(classroom._id);
    setStep("roster");
  }

  if (loading && step === "list" && classrooms.length === 0) {
    return <div className="center-page"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="topbar">
        <h1>My Classes</h1>
        {step === "list" && <button className="btn btn-purple" onClick={() => setStep("create")}>+ Create class</button>}
      </div>

      {step === "list" && (
        <div className="grouped">
          {classrooms.length ? classrooms.map((c) => (
            <div className="row" key={c._id}>
              <div className="row-icon purple">🏫</div>
              <div><div className="row-title">{c.name}</div><div className="row-sub">Created {new Date(c.createdAt).toLocaleDateString()}</div></div>
              <div className="row-right">
                <div className="row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => viewRoster(c)}>View roster</button>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteClass(c)}>Delete</button>
                </div>
              </div>
            </div>
          )) : <div className="empty">No classes yet. Click "Create class" to get started — you'll upload a CSV of students and Smart-Class will email each of them a join link.</div>}
        </div>
      )}

      {step === "create" && (
        <div className="form-card">
          <div className="section-label"><span>Create a new class</span></div>
          <form onSubmit={handleCreateClass}>
            <div className="form-row">
              <input type="text" placeholder="Class name, e.g. MCA Semester 4 - A" value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setStep("list")} style={{ marginRight: 8 }}>Cancel</button>
              <button className="btn btn-purple" disabled={loading}>{loading ? "Creating…" : "Create class"}</button>
            </div>
          </form>
        </div>
      )}

      {step === "upload" && selected && (
        <div className="form-card">
          <div className="section-label"><span>Upload student roster — {selected.name}</span></div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0 }}>
            Upload a CSV with columns <strong>name, email, enrollmentNo</strong>. We'll show you a preview
            before anything is sent — each valid student then gets an emailed join link.
          </p>
          <div className="form-row">
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn btn-purple" disabled={!file || loading} onClick={handlePreview}>
              {loading ? "Parsing…" : "Preview roster"}
            </button>
          </div>
        </div>
      )}

      {step === "preview" && preview && (
        <div>
          <div className="form-card">
            <div className="section-label"><span>Preview — {preview.validCount} valid, {preview.errorCount} skipped</span></div>
            {preview.errors.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {preview.errors.map((e, i) => (
                  <div key={i} className="error-text">Row {e.row}: {e.reason}</div>
                ))}
              </div>
            )}
          </div>
          <div className="grouped" style={{ marginBottom: 18 }}>
            {preview.valid.map((s, i) => (
              <div className="row" key={i}>
                <div className="row-icon purple">👤</div>
                <div><div className="row-title">{s.name}</div><div className="row-sub">{s.email}{s.enrollmentNo ? ` · ${s.enrollmentNo}` : ""}</div></div>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setStep("upload")} style={{ marginRight: 8 }}>Back</button>
            <button className="btn btn-purple" disabled={loading || preview.validCount === 0} onClick={handleConfirm}>
              {loading ? "Sending invites…" : `Send ${preview.validCount} invite(s)`}
            </button>
          </div>
        </div>
      )}

      {step === "roster" && selected && (
        <div>
          <div className="topbar" style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 20 }}>{selected.name} — Roster</h1>
            <button className="btn btn-outline btn-sm" onClick={() => { setStep("list"); loadClassrooms(); }}>← All classes</button>
          </div>
          {roster && (
            <div className="grid3">
              <div className="stat-mini"><div className="lbl">Total invited</div><div className="val">{roster.total}</div></div>
              <div className="stat-mini"><div className="lbl">Joined</div><div className="val">{roster.joined}</div></div>
              <div className="stat-mini"><div className="lbl">Pending</div><div className="val">{roster.pending}</div></div>
            </div>
          )}
          <div className="grouped">
            {roster?.invites?.length ? roster.invites.map((inv) => (
              <div className="row" key={inv._id}>
                <div className="row-icon purple">👤</div>
                <div><div className="row-title">{inv.name}</div><div className="row-sub">{inv.email}</div></div>
                <div className="row-right">
                  <span className={"badge-status " + inv.status}>{inv.status}</span>
                  {inv.status === "invited" && <button className="btn btn-outline btn-sm" onClick={() => handleResend(inv._id)}>Resend</button>}
                  <button className="btn btn-danger-outline btn-sm" onClick={() => handleRemoveStudent(inv)}>Remove</button>
                </div>
              </div>
            )) : <div className="empty">No students invited yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
