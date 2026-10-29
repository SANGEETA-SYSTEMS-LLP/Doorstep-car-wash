import ResponsiveNavigation from "./ResponsiveNavigation";
import { WashNowMark } from "./WashNowBrand";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CircleDollarSign,
  TriangleAlert,
  User,
  BadgeCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

const menuItems = [
  { label: "Dashboard", path: "/supervisor", icon: LayoutDashboard },
  { label: "Active Jobs", path: "/supervisor/jobs", icon: BriefcaseBusiness },
  { label: "Washers by location", path: "/supervisor/washers", icon: User },
  { label: "Washer verification", path: "/supervisor/washers/review", icon: BadgeCheck },
  { label: "Add Washer", path: "/supervisor/washers/add", icon: User },
  { label: "Live operations", path: "/supervisor/operations", icon: LayoutDashboard },
  { label: "Extra Charges", path: "/supervisor/extra-charges", icon: CircleDollarSign },
  { label: "Escalations", path: "/supervisor/escalations", icon: TriangleAlert },
  { label: "Profile", path: "/supervisor/profile", icon: User },
];

export default function SupervisorSidebar() {
  const {
    logout,
    profile,
  } = useAuth();

  const navigate =
    useNavigate();

  const handleLogout =
    async () => {
      try {
        await logout();

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Supervisor logout:",
          error
        );
      }
    };

  return (
    <ResponsiveNavigation title="Supervisor workspace"><aside className="flex min-h-screen w-72 flex-col border-r border-slate-200/80 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3"><WashNowMark /><div><h1 className="text-lg font-black tracking-tight text-slate-950">WashNow</h1><p className="mt-0.5 text-xs text-slate-500">Supervisor workspace</p></div></div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />Operations access <span className="ml-auto text-slate-400">Secure</span></div>
      </div>

      <nav aria-label="Supervisor navigation" className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        {menuItems.filter(item => profile?.role !== "accountant").map(
          ({
            label,
            path,
            icon: Icon,
          }) => (
            <NavLink
              key={path}
              to={path}
              end={
                path === "/supervisor" || path === "/supervisor/washers"
              }
              className={({
                isActive,
              }) =>
                `group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-green-100 bg-green-50 text-green-800 shadow-sm shadow-green-900/[0.03]"
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`
              }
            >
              <Icon
                size={19}
                className="shrink-0"
              />

              {label}
              <ChevronRight size={15} className="ml-auto opacity-0 transition-opacity group-hover:opacity-50" />
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-green-900 shadow-sm ring-1 ring-slate-100">{profile?.full_name?.trim()?.[0]?.toUpperCase() || "S"}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">
            {profile?.full_name ||
              "Supervisor"}
          </p><p className="mt-0.5 text-xs text-slate-500">
            {profile?.role === "accountant" ? "Accountant" : "Supervisor"}
          </p></div>
        </div>

        <button
          onClick={
            handleLogout
          }
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700"
        >
          <LogOut
            size={18}
          />

          Logout
        </button>
      </div>
    </aside></ResponsiveNavigation>
  );
}
