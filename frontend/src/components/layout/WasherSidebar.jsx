import ResponsiveNavigation from "./ResponsiveNavigation";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Banknote,
  BriefcaseBusiness,
  Car,
  CircleUserRound,
  Gauge,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    path: "/washer",
    icon: Gauge,
    end: true,
  },
  {
    label: "My Jobs",
    path: "/washer/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Earnings",
    path: "/washer/earnings",
    icon: Banknote,
  },
  {
    label: "Profile",
    path: "/washer/profile",
    icon: CircleUserRound,
  },
];

function WasherSidebar() {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const displayName = profile?.full_name || "Washer Partner";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ResponsiveNavigation title="WashNow"><aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-700 text-white shadow-sm">
          <Car size={21} />
        </div>

        <div>
          <p className="font-black tracking-tight text-slate-950">
            WashNow
          </p>

          <p className="text-xs text-slate-500">
            Partner workspace
          </p>
        </div>
      </div>

      <nav aria-label="Washer workspace" className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-blue-100 bg-blue-50 text-blue-800 shadow-sm shadow-blue-900/[0.03]"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`
              }
            >
              <Icon size={19} />

              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800 ring-2 ring-white">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {displayName}
            </p>

            <p className="text-xs font-medium text-slate-500">
              {profile?.role === "washer" ? "Washer partner" : "Account"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside></ResponsiveNavigation>
  );
}

export default WasherSidebar;
