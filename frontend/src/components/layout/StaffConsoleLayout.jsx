import ResponsiveNavigation from "./ResponsiveNavigation";
import { WashNowBrand } from "./WashNowBrand";
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
import { useAuth } from "../../context/AuthContext";

const adminLinks = [
  { label: "Live operations map", path: "/admin/operations", icon: MapPinned },
  { label: "Customer Support", path: "/admin/support", icon: Users },
  { label: "Sub Admin", path: "/admin/sub-admin", icon: Users },
  { label: "Accountant dashboard", path: "/admin/accountant", icon: CircleDollarSign },
  { label: "Payment confirmations", path: "/admin/finance", icon: Banknote },
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
];

export default function StaffConsoleLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSupport = location.pathname.startsWith("/support");
  const links = isSupport ? [{ label: "Support tickets", path: "/support", icon: Users }] : adminLinks.filter(link => link.path !== "/admin/finance" || profile?.role === "super_admin");
  const title = isSupport ? "Support Console" : "Admin Console";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Staff console logout:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <ResponsiveNavigation title={title}><aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-6">
          <WashNowBrand to={isSupport ? "/support" : "/admin"} subtitle={title} />
        </div>
        <nav aria-label={`${title} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
          {[...links].sort((a,b) => a.path === "/admin" ? -1 : b.path === "/admin" ? 1 : 0).map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isActive
                    ? "bg-green-50 text-green-700"
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
      </aside></ResponsiveNavigation>
      <main className="min-w-0 flex-1 p-4 sm:p-6 xl:p-10">
        <Outlet />
      </main>
    </div>
  );
}
