import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
const adminLinks = [["", "Overview"], ["societies", "Societies"], ["zones", "Service zones"], ["services", "Services"], ["packages", "Packages & pricing"], ["customers", "Customers"], ["washers", "Washers"], ["supervisors", "Supervisors"], ["bookings", "Bookings"], ["payments", "Payments"], ["earnings", "Earnings"], ["settlements", "Settlements"], ["tickets", "Support tickets"]];
export default function AdminLayout({ mode = "admin" }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const base = "/" + mode;
  const links = mode === "accountant" ? [["", "Payments"], ["earnings", "Earnings"], ["settlements", "Settlements"]] : mode === "support" ? [["", "Support tickets"]] : adminLinks;
  return <div className="min-h-screen bg-slate-50 lg:flex"><aside className="border-b border-slate-200 bg-white p-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r"><p className="text-xl font-black">Car Wash</p><p className="mb-5 mt-1 text-sm font-semibold capitalize text-blue-700">{mode} workspace</p><nav className="flex flex-wrap gap-2 lg:block lg:space-y-1">{links.map(([path, label]) => <NavLink key={path} end={!path} to={base + (path ? "/" + path : "")} className={({ isActive }) => "block rounded-lg px-3 py-2 text-sm font-semibold " + (isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}>{label}</NavLink>)}</nav><div className="mt-6 border-t border-slate-100 pt-4"><p className="text-sm font-semibold">{profile?.full_name}</p><p className="mt-1 text-xs text-slate-500">{profile?.role?.replaceAll("_", " ")}</p><button className="mt-4 text-sm font-semibold text-red-700" onClick={async () => { try { await logout(); navigate("/login"); } catch (err) { setError(err.message); } }}>Sign out</button>{error && <p role="alert">{error}</p>}</div></aside><main className="min-w-0 flex-1 p-5 lg:p-8"><Outlet /></main></div>;
}
