import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
export default function AdminDashboard() {
  const { data, loading, error, refresh } = useApi("/admin/dashboard");
  return <section><div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Operations overview</h1><button onClick={refresh} className="text-blue-700 underline">Refresh</button></div><p className="mt-2 text-slate-500">Manage service coverage, catalogue, customers and bookings.</p>{loading && <p className="mt-6" role="status">Loading totals...</p>}{error && <p role="alert" className="mt-6 text-red-700">{error}</p>}<div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data?.stats.map(stat => <Link key={stat.key} to={"/admin/" + stat.key} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-400"><p className="text-sm text-slate-500">{stat.label}</p><p className="mt-3 text-3xl font-bold">{stat.count}</p></Link>)}</div></section>;
}
