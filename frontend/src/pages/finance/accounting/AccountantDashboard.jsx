import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import { Banknote, ArrowRight, FileText, ChartColumn, Wallet, CircleDollarSign } from "lucide-react";
import ServiceCompletionFeed from "../../../components/operations/ServiceCompletionFeed";
const sections = [
  { title: "Payments", description: "Review customer payments and payment statuses.", path: "payments", icon: Banknote },
  { title: "Payment confirmations", description: "Review washer payouts and payment status. Supervisor payout setup is pending.", path: "finance", icon: Wallet },
  { title: "Invoices", description: "Find booking invoices and service billing details.", path: "invoices", icon: FileText },
  { title: "Reports", description: "Review financial reports and totals.", path: "reports", icon: ChartColumn },
  { title: "Earnings", description: "Review washer earnings and commissions.", path: "earnings", icon: CircleDollarSign },
  { title: "Settlements", description: "Track settlement records and their status.", path: "settlements", icon: Banknote },
];
export default function AccountantDashboard({ base = "/admin" }) {
  const {profile} = useAuth();
  const visible = profile?.role === "supervisor" ? sections.filter(s => ["payments", "earnings", "settlements"].includes(s.path)) : profile?.role === "sub_admin" ? sections.filter(s => s.path !== "finance") : sections;
  return <section>
    <p className="text-sm font-semibold text-green-600">ACCOUNTS</p>
    <h1 className="mt-2 text-3xl font-bold text-slate-900">Accounts</h1>
    <p className="mt-3 text-slate-500">View financial records here. Authorized accountants and administrators can manage refunds and payouts.</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(({ title, description, path, icon: Icon }) => <Link key={path} to={base + "/" + path} className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors duration-150 hover:border-green-400">
      <Icon className="text-green-600" size={26} /><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p><span className="mt-5 flex items-center gap-2 text-sm font-semibold text-green-700">Open <ArrowRight size={16} /></span>
    </Link>)}</div>
    <div className="mt-8"><ServiceCompletionFeed /></div>
  </section>;
}
