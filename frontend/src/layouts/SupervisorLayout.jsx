import {
  Outlet,
} from "react-router-dom";

import SupervisorSidebar
  from "../components/layout/SupervisorSidebar";

import {
  useAuth,
} from "../context/AuthContext";

export default function SupervisorLayout() {
  const { profile } =
    useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SupervisorSidebar />

      <main className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div>
            <p className="text-sm text-slate-500">
              Operations
            </p>

            <h2 className="font-bold text-slate-900">
              Supervisor Control Center
            </h2>
          </div>

          <div className="text-right">
            <p className="font-semibold text-slate-900">
              {profile?.full_name ||
                "Supervisor"}
            </p>

            <p className="text-xs text-slate-500">
              Operations Supervisor
            </p>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}