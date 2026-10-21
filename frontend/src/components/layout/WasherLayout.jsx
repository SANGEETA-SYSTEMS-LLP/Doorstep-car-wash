import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import WasherSidebar from "./WasherSidebar";

function WasherLayout() {
  const { profile } = useAuth();
  const displayName = profile?.full_name || "Washer Partner";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <WasherSidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-5 shadow-[0_1px_3px_rgba(15,23,42,.03)] backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><ShieldCheck size={17} /></span>
            <span className="font-semibold text-slate-800">Partner workspace</span>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <span className="hidden text-slate-500 sm:inline">Daily operations</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-800">{displayName}</span><span className="text-xs capitalize text-slate-500">{profile?.role || "washer"}</span></span>
            <div aria-label={`${displayName} avatar`} className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-blue-900 text-sm font-bold text-white ring-2 ring-white shadow-sm">{initials}</div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WasherLayout;
