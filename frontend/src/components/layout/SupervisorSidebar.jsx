import {
  LayoutDashboard,
  BriefcaseBusiness,
  CircleDollarSign,
  TriangleAlert,
  User,
  LogOut,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

const menuItems = [
  { label: "Live operations", path: "/supervisor/operations", icon: LayoutDashboard },
  {
    label: "Dashboard",
    path: "/supervisor",
    icon: LayoutDashboard,
  },
  {
    label: "Active Jobs",
    path: "/supervisor/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Extra Charges",
    path: "/supervisor/extra-charges",
    icon: CircleDollarSign,
  },
  {
    label: "Escalations",
    path: "/supervisor/escalations",
    icon: TriangleAlert,
  },
  {
    label: "Profile",
    path: "/supervisor/profile",
    icon: User,
  },
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
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <h1 className="text-xl font-black text-slate-900">
          Car Wash
        </h1>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
          Supervisor Panel
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map(
          ({
            label,
            path,
            icon: Icon,
          }) => (
            <NavLink
              key={path}
              to={path}
              end={
                path ===
                "/supervisor"
              }
              className={({
                isActive,
              }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon
                size={19}
              />

              {label}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-4 rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">
            {profile?.full_name ||
              "Supervisor"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Supervisor
          </p>
        </div>

        <button
          onClick={
            handleLogout
          }
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <LogOut
            size={18}
          />

          Logout
        </button>
      </div>
    </aside>
  );
}