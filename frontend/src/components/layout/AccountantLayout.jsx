import { Link, NavLink, Outlet } from "react-router-dom";
import { Banknote, ChartColumn, CircleDollarSign, FileText, LayoutDashboard, Wallet } from "lucide-react";
import ResponsiveNavigation from "./ResponsiveNavigation";
import { WashNowBrand } from "./WashNowBrand";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { label: "Overview", path: "/accountant", icon: LayoutDashboard },
  { label: "Payments", path: "/accountant/payments", icon: Banknote },
  { label: "Payment confirmations", path: "/accountant/finance", icon: Wallet, roles: ["accountant", "super_admin"] },
  { label: "Earnings", path: "/accountant/earnings", icon: CircleDollarSign },
  { label: "Settlements", path: "/accountant/settlements", icon: Banknote },
  { label: "Reports", path: "/accountant/reports", icon: ChartColumn, roles: ["accountant", "sub_admin", "super_admin"] },
  { label: "Invoices", path: "/accountant/invoices", icon: FileText, roles: ["accountant", "sub_admin", "super_admin"] },
];

export default function AccountantLayout() {
  const { profile } = useAuth();
  const role = profile?.role;
  const links = navigation.filter(item => !item.roles || item.roles.includes(role));

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-clip bg-slate-50 lg:flex-row">
      <ResponsiveNavigation title="Accounting workspace">
        <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white">
          <div className="border-b border-slate-100 px-5 py-5">
            <WashNowBrand to="/accountant" subtitle="Accounting workspace" />
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3 py-2 text-[11px] font-semibold text-green-900"><span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />Finance operations<span className="ml-auto text-green-700/70">Secure</span></div>
          </div>
          <nav aria-label="Accounting navigation" className="flex-1 space-y-1 p-3">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            {links.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === "/accountant"} className={({ isActive }) => `flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${isActive ? "border-green-100 bg-green-50 text-green-800 shadow-sm shadow-green-900/[0.03]" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                <Icon size={19} className="shrink-0" />{label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-4">
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-green-900 shadow-sm ring-1 ring-slate-100">{profile?.full_name?.trim()?.[0]?.toUpperCase() || "A"}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900">{profile?.full_name || "Accountant"}</span><span className="mt-0.5 block text-xs capitalize text-slate-500">{role?.replaceAll("_", " ") || "Accountant"}</span></span>
            </div>
          </div>
        </aside>
      </ResponsiveNavigation>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-[#f8faf9] px-4 py-3 sm:px-6 lg:px-8">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">WashNow · Finance</p><h1 className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">Accounting workspace</h1></div>
          <span className="max-w-[45vw] truncate rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold capitalize text-slate-600 sm:max-w-none">{profile?.full_name || "Accountant"} · {role?.replaceAll("_", " ") || "accountant"}</span>
        </header>
        <div className="mx-auto min-w-0 w-full max-w-[1720px] p-4 sm:p-6 xl:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
