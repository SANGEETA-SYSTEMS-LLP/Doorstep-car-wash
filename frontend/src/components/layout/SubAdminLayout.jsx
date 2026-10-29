import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ResponsiveNavigation from "./ResponsiveNavigation";
import { WashNowBrand } from "./WashNowBrand";
import { Banknote, BriefcaseBusiness, Building2, CarFront, ClipboardList, Gauge, LogOut, MapPinned, Package, Users, Wrench } from "lucide-react";

const links = [
  { label: "Dashboard", path: "/sub-admin", icon: Gauge, end: true },
  { label: "Live operations map", path: "/sub-admin/operations", icon: MapPinned },
  { label: "Customer support", path: "/sub-admin/support", icon: Users },
  { label: "Customers", path: "/sub-admin/customers", icon: Users },
  { label: "Washers", path: "/sub-admin/washers", icon: CarFront },
  { label: "Supervisors", path: "/sub-admin/supervisors", icon: BriefcaseBusiness },
  { label: "Bookings", path: "/sub-admin/bookings", icon: ClipboardList },
  { label: "Societies", path: "/sub-admin/societies", icon: Building2 },
  { label: "Service areas", path: "/sub-admin/zones", icon: MapPinned },
  { label: "Services", path: "/sub-admin/services", icon: Wrench },
  { label: "Packages and pricing", path: "/sub-admin/packages", icon: Package },
  { label: "Payments", path: "/sub-admin/payments", icon: Banknote },
];

export default function SubAdminLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sub-admin logout:", error);
    }
  }

  return <div className="flex min-h-screen min-w-0 flex-col bg-slate-50 lg:flex-row">
    <ResponsiveNavigation title="Sub Admin workspace">
      <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-6">
          <WashNowBrand to="/sub-admin" subtitle="Sub Admin workspace" />
        </div>
        <nav aria-label="Sub Admin navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-green-50 text-green-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Icon size={18} />{label}
          </NavLink>)}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-800">{profile?.full_name || "Sub Admin"}</p>
        </div>
      </aside>
    </ResponsiveNavigation>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 xl:px-10">
        <div><p className="text-xs font-semibold text-green-700">WashNow</p><h1 className="text-sm font-bold text-slate-900">Sub Admin workspace</h1></div>
        <button type="button" onClick={handleLogout} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={16} />Logout</button>
      </header>
      <div className="p-4 sm:p-6 xl:p-10"><Outlet /></div>
    </main>
  </div>;
}
