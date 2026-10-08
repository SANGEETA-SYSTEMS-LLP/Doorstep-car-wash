import { NavLink } from "react-router-dom";
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
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* LOGO */}

      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Car size={21} />
        </div>

        <div>
          <p className="font-bold">
            WashNow
          </p>

          <p className="text-xs text-slate-400">
            Washer Partner
          </p>
        </div>
      </div>

      {/* MENU */}

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />

              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* USER */}

      <div className="border-t border-slate-200 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            RK
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              Rahul Kumar
            </p>

            <p className="text-xs text-green-600">
              Verified Washer
            </p>
          </div>
        </div>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default WasherSidebar;