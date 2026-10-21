import {
  Outlet,
} from "react-router-dom";

import SupervisorSidebar
  from "../components/layout/SupervisorSidebar";

import {
  useAuth,
} from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";

export default function SupervisorLayout() {
  const { profile } =
    useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f8fb] lg:flex-row">
      <SupervisorSidebar />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_1px_3px_rgba(15,23,42,.03)] backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-800 ring-1 ring-blue-100 sm:flex"><ShieldCheck size={20} /></span>
            <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">WashNow · Operations</p><h2 className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">Supervisor workspace</h2></div>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-slate-200/90 bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-blue-950 text-sm font-bold text-white">{profile?.full_name?.trim()?.[0]?.toUpperCase() || "S"}</span>
            <div><p className="max-w-40 truncate text-sm font-semibold text-slate-900">{profile?.full_name || "Supervisor"}</p><p className="text-[11px] text-slate-500">{profile?.role === "accountant" ? "Accountant" : "Operations Supervisor"}</p></div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1720px] p-4 sm:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
