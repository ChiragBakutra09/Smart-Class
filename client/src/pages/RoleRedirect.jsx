import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!profile) return navigate("/login", { replace: true });
    if (profile.role === "teacher" || profile.role === "admin") navigate("/teacher", { replace: true });
    else navigate("/student", { replace: true });
  }, [profile, loading, navigate]);

  return (
    <div className="center-page">
      <div className="spinner" />
    </div>
  );
}
