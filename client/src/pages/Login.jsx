import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { logIn, fetchMe } from "../services/authService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { getFirebaseErrorMessage } from "../utils/firebaseErrors";
import SetupNotice from "../components/SetupNotice";

export default function Login() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setProfile } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await logIn(email, password);
      const me = await fetchMe();
      setProfile(me);
      showToast("Welcome back!", "success");
      // If this login came from an invite link, hand off to /join/:token so the
      // single, robust join flow there handles it (with a persistent error state
      // instead of a toast that can be missed).
      navigate(inviteToken ? `/join/${inviteToken}` : "/redirect");
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
        <h1>{inviteToken ? "Log in to join your class" : "Log in to Smart-Class"}</h1>
        <SetupNotice />
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
        </form>
        <div className="auth-switch">
          Don't have an account? <Link to={inviteToken ? `/register?invite=${inviteToken}` : "/register"}>Register</Link>
        </div>
      </div>
    </div>
  );
}
