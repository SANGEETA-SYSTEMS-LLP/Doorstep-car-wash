import { Link } from "react-router-dom";

const links = [
  ["Live operations map", "operations"],
  ["Customer support", "support"],
  ["Customers", "customers"],
  ["Washers", "washers"],
  ["Supervisors", "supervisors"],
  ["Bookings", "bookings"],
  ["Societies", "societies"],
  ["Service areas", "zones"],
  ["Services", "services"],
  ["Packages and pricing", "packages"],
];

export default function AdminRoleDashboard({ base = "/admin" }) {
  return (
    <section>
      <p className="text-sm font-semibold text-blue-700">ADMIN WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Sub Admin</h1>
      <p className="mt-3 text-slate-600">Manage daily operations, customers, and service settings.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(([label, path]) => (
          <Link key={path} to={`${base}/${path}`} className="rounded-xl border border-slate-200 bg-white p-5 font-semibold text-slate-800 transition hover:border-slate-400">
            {label}<span className="float-right text-slate-500">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
