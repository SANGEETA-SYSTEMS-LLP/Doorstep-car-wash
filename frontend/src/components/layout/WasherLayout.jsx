import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import WasherSidebar from "./WasherSidebar";
import useWasherWorkspace from "../../hooks/useWasherWorkspace";
import WasherAssignmentAlerts from "../washer/WasherAssignmentAlerts";

function WasherLayout() {
  const { profile, user } = useAuth();
  const workspace = useWasherWorkspace();
  const displayName = profile?.full_name || "Washer Partner";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const status = workspace.data?.washer?.status;
  const online = status === "available";
  const busy = status === "busy";
  const availabilityText = workspace.loading && !status ? "Checking status" : online ? "Online" : busy ? "On a job" : status ? "Offline" : "Status unavailable";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <WasherSidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-[#f8faf9] px-5 lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><ShieldCheck size={17} /></span>
            <span className="font-semibold text-slate-800">Partner workspace</span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="hidden text-slate-500 sm:inline">Daily operations</span>
          </div>
          <div className="flex items-center gap-3">
            <WasherAssignmentAlerts userId={user?.id} data={workspace.data} />
            <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${online ? "bg-green-100 text-green-800" : busy ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}><span className={`h-2 w-2 rounded-full ${online ? "bg-green-600" : busy ? "bg-amber-500" : "bg-slate-400"}`} />{availabilityText}</span>
            <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-800">{displayName}</span><span className="text-xs capitalize text-slate-500">{profile?.role || "washer"}</span></span>
            <div aria-label={`${displayName} avatar`} className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900 text-sm font-bold text-white ring-2 ring-white shadow-sm">{initials}</div>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet context={workspace} />
        </main>
      </div>
    </div>
  );
}

export default WasherLayout;
