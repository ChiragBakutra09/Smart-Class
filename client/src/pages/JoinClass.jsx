import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { getInviteByToken, joinClassroomByToken } from "../services/classroomService";
import { useToast } from "../context/ToastContext";

export default function JoinClass() {
  const { token } = useParams();
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [invite, setInvite] = useState(null);
  const [inviteError, setInviteError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [checkingAccount, setCheckingAccount] = useState(false);

  useEffect(() => {
    getInviteByToken(token)
      .then(setInvite)
      .catch(() => setInviteError("This invite link is invalid or has expired."));
  }, [token]);

  // Auto-detect: no manual "Register vs Log in" choice. If not logged in, silently
  // check whether this email already has an account and route straight there.
  useEffect(() => {
    if (loading || profile || !invite || invite.alreadyJoined || inviteError) return;
    if (!isFirebaseConfigured) return;

    setCheckingAccount(true);
    fetchSignInMethodsForEmail(auth, invite.email)
      .then((methods) => {
        navigate(methods.length > 0 ? `/login?invite=${token}` : `/register?invite=${token}`, { replace: true });
      })
      .catch(() => {
        navigate(`/register?invite=${token}`, { replace: true });
      });
  }, [loading, profile, invite, inviteError, token, navigate]);

  useEffect(() => {
    if (loading || !profile || !invite || invite.alreadyJoined) return;

    if (profile.role !== "student") {
      setJoinError(`This is a student invite, but you're logged in as a ${profile.role}. Log out and use a student account to join.`);
      return;
    }

    setJoining(true);
    joinClassroomByToken(token)
      .then(() => {
        showToast(`You've joined ${invite.classroomName}!`, "success");
        navigate("/student");
      })
      .catch((err) => {
        setJoinError(err.response?.data?.message || "Could not join this classroom.");
        setJoining(false);
      });
  }, [loading, profile, invite, token]);

  if (loading || joining || checkingAccount) {
    return (
      <div className="center-page">
        <div className="spinner" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="mark">SC</div>
          <h1>Invite not found</h1>
          <div className="error-text">{inviteError}</div>
        </div>
      </div>
    );
  }

  if (invite?.alreadyJoined) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="mark">SC</div>
          <h1>Already joined</h1>
          <div className="sub">You've already joined {invite.classroomName}.</div>
          <Link to="/redirect" className="auth-submit" style={{ display: "block", textAlign: "center" }}>Go to dashboard</Link>
        </div>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="mark">SC</div>
          <h1>Couldn't join classroom</h1>
          <div className="error-text">{joinError}</div>
          <Link to="/redirect" className="auth-submit" style={{ display: "block", textAlign: "center", marginTop: 14 }}>Go to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="spinner" />
    </div>
  );
}
