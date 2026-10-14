import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RoleRoute({
  allowedRoles,
  children,
}) {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  const developmentTestMode =
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Unable to load user profile.
      </div>
    );
  }

  if (
    !developmentTestMode &&
    !allowedRoles.includes(
      profile.role
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return (
    <>
      {developmentTestMode && (
        <div
          role="status"
          className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950"
        >
          <p>Local test mode: all role pages are accessible. Start the backend with npm run dev to enable cross-role API actions.</p>
          <nav aria-label="Test dashboards" className="mt-2 flex flex-wrap justify-center gap-4">
            <Link className="underline" to="/">Home</Link>
            <Link className="underline" to="/customer">Customer</Link>
            <Link className="underline" to="/washer">Washer</Link>
            <Link className="underline" to="/supervisor">Supervisor</Link>
            <Link className="underline" to="/admin">Admin</Link>
            <Link className="underline" to="/accountant">Accountant</Link>
          </nav>
        </div>
      )}
      {children}
    </>
  );
}

export default RoleRoute;