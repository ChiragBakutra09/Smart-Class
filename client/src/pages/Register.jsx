import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { signUp } from "../services/authService";
import { getInviteByToken } from "../services/classroomService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import SetupNotice from "../components/SetupNotice";

export default function Register() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setProfile } = useAuth();

  useEffect(() => {
    if (!inviteToken) return;
    getInviteByToken(inviteToken)
      .then((data) => {
        if (data.alreadyJoined) {
          setError("This invite has already been used. Please log in instead.");
          return;
        }
        setInviteInfo(data);
        setName(data.studentName || "");
        setEmail(data.email || "");
      })
      .catch(() => setError("This invite link is invalid or has expired."));
  }, [inviteToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await signUp(email, password, name, role, inviteToken || undefined);
      setProfile(user);
      showToast("Account created!", "success");
      navigate("/redirect");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="mark">SC</div>
        <h1>{inviteInfo ? `Join ${inviteInfo.classroomName}` : "Create your account"}</h1>
        {inviteInfo && <div className="sub">You've been invited by your teacher — finish setting up your account to join.</div>}
        <SetupNotice />

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="auth-field">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!inviteInfo} />
          </div>
          <div className="auth-field">
            <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {!inviteToken && (
            <div className="role-select">
              <label>
                <input type="radio" name="role" checked={role === "student"} onChange={() => setRole("student")} />
                <span>Student</span>
              </label>
              <label>
                <input type="radio" name="role" checked={role === "teacher"} onChange={() => setRole("teacher")} />
                <span>Teacher</span>
              </label>
            </div>
          )}

          {error && <div className="error-text">{error}</div>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account…" : inviteInfo ? "Join classroom" : "Register"}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to={inviteToken ? `/login?invite=${inviteToken}` : "/login"}>Log in</Link>
        </div>
      </div>
    </div>
  );
}
