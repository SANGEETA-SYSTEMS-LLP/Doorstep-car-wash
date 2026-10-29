import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileLoadError from "../components/common/ProfileLoadError";
import { isPrimaryAdminEmail } from "../../../shared/adminAccess.mjs";

export default function RoleRoute({ allowedRoles, allowedEmail, children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <ProfileLoadError />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  if (allowedEmail && !isPrimaryAdminEmail(user.email)) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10"><section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold text-slate-950">Admin access restricted</h1><p className="mt-3 text-sm leading-6 text-slate-600">This admin console is available only to its designated administrator.</p><Link to="/" className="mt-6 inline-flex rounded-lg bg-green-800 px-5 py-3 text-sm font-semibold text-white hover:bg-green-900">Back to WashNow</Link></section></main>;
  return children;
}
