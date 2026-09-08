import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-page">
        <div className="spinner" />
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (role && profile.role !== role) return <Navigate to="/redirect" replace />;
  return children;
}
