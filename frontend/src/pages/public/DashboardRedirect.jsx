import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function DashboardRedirect() {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading your dashboard...
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
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">
            Profile not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your account exists, but its application
            profile could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  switch (profile.role) {
    case "customer":
      return (
        <Navigate
          to="/customer"
          replace
        />
      );

    case "washer":
      return (
        <Navigate
          to="/washer"
          replace
        />
      );

    case "supervisor":
      return (
        <Navigate
          to="/supervisor"
          replace
        />
      );

    case "support":
      return (
        <Navigate
          to="/"
          replace
        />
      );

    case "accountant":
      return (
        <Navigate
          to="/accountant"
          replace
        />
      );

    case "sub_admin":
    case "super_admin":
      return (
        <Navigate
          to="/admin"
          replace
        />
      );

    default:
      return (
        <Navigate
          to="/"
          replace
        />
      );
  }
}

export default DashboardRedirect;