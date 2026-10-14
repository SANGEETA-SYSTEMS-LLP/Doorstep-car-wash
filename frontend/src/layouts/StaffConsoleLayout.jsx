import {
  Banknote,
  BriefcaseBusiness,
  Building2,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LogOut,
  MapPinned,
  Package,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminLinks = [
  { label: "Refunds and payouts", path: "/admin/finance", icon: Banknote },
  { label: "Invoices", path: "/admin/invoices", icon: ClipboardList },
  { label: "Reports", path: "/admin/reports", icon: Gauge },
  { label: "Dashboard", path: "/admin", icon: Gauge, end: true },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Washers", path: "/admin/washers", icon: CarFront },
  { label: "Supervisors", path: "/admin/supervisors", icon: BriefcaseBusiness },
  { label: "Societies", path: "/admin/societies", icon: Building2 },
  { label: "Bookings", path: "/admin/bookings", icon: ClipboardList },
  { label: "Services", path: "/admin/services", icon: Wrench },
  { label: "Packages and pricing", path: "/admin/packages", icon: Package },
  { label: "Service areas", path: "/admin/zones", icon: MapPinned },
  { label: "Payments", path: "/admin/payments", icon: Banknote },
  { label: "Earnings", path: "/admin/earnings", icon: CircleDollarSign },
  { label: "Settlements", path: "/admin/settlements", icon: CircleDollarSign },
];

const accountantLinks = [
  { label: "Refunds and payouts", path: "/accountant/finance", icon: Banknote },
  { label: "Invoices", path: "/accountant/invoices", icon: ClipboardList },
  { label: "Reports", path: "/accountant/reports", icon: Gauge },
  { label: "Payments", path: "/accountant/payments", icon: Banknote },
  { label: "Earnings", path: "/accountant/earnings", icon: CircleDollarSign },
  { label: "Settlements", path: "/accountant/settlements", icon: CircleDollarSign },
];

export default function StaffConsoleLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountant = location.pathname.startsWith("/accountant");
  const links = isAccountant ? accountantLinks : adminLinks;
  const title = isAccountant ? "Finance Console" : "Admin Console";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Staff console logout:", error);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-6">
          <h1 className="text-lg font-black text-slate-900">Doorstep Car Wash</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
            {title}
          </p>
        </div>
        <nav aria-label={`${title} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="mb-3 truncate text-sm font-semibold text-slate-800">
            {profile?.full_name || title}
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
