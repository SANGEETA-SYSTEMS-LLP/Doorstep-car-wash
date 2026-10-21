import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileLoadError from "../components/common/ProfileLoadError";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <ProfileLoadError />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
