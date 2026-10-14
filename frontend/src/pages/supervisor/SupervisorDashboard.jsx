import {
  useEffect,
  useState,
} from "react";

import {
  getSupervisorDashboard,
} from "../../services/supervisorService";
import SupervisorDashboardCards from "./SupervisorDashboardCards";

export default function SupervisorDashboard() {
  const [
    stats,
    setStats,
  ] = useState({
    activeJobs: 0,
    escalations: 0,
    pendingExtraCharges: 0,
    completedToday: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          setLoading(true);

          const data =
            await getSupervisorDashboard();

          setStats(
            data.stats
          );
        } catch (error) {
          console.error(error);

          setError(
            error.message ||
              "Unable to load supervisor dashboard."
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        Loading supervisor dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-600">
          Operations Overview
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Supervisor Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor active services,
          escalations and approvals.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <SupervisorDashboardCards stats={stats} />
    </div>
  );
}