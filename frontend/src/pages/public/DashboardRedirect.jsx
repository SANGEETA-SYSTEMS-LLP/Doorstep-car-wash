import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import ProfileLoadError from "../../components/common/ProfileLoadError";

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
    return <ProfileLoadError />;
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
          to="/support"
          replace
        />
      );

    case "accountant":
      return (
        <Navigate
          to="/supervisor/accountant"
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
