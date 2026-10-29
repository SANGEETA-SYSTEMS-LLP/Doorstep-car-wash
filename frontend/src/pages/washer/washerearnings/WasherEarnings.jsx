import { useEffect, useState } from "react";
import { ArrowDownToLine, Banknote, CircleDollarSign, Clock3, RefreshCw } from "lucide-react";
import useApi from "../../../hooks/useApi";

function money(amount) {
  return Number(amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paymentLabel(row) {
  if (row.status === "settled" && row.payout?.provider_status === "processed") return "Payment Completed";
  if (row.status === "settled") return "Paid";
  if (row.payment?.status === "paid" && ["cod", "cash"].includes(String(row.payment.payment_method || "").toLowerCase())) return "Cash collected";
  if (row.status === "pending") return "Awaiting payout";
  return String(row.status || "Processing").replaceAll("_", " ");
}

function SummaryCard({ icon: Icon, title, amount, detail, tone }) {
  const styles = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700";
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{money(amount)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div><span className={`rounded-xl p-3 ${styles}`}><Icon size={20} /></span></div></article>;
}

function StatusPill({ row }) {
  const label = paymentLabel(row);
  const received = label === "Paid" || label === "Payment Completed" || label === "Cash collected";
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${received ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export default function WasherEarnings() {
  const [page, setPage] = useState(1);
  const ledger = useApi("/account/earnings?page=" + page);
  const summary = useApi("/account/earnings/lifetime-summary");

  useEffect(() => {
    const timer = setInterval(() => { ledger.refresh(); summary.refresh(); }, 30000);
    return () => clearInterval(timer);
  }, [ledger.refresh, summary.refresh]);

  return <main className="mx-auto max-w-7xl space-y-7 p-5 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Payouts & activity</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My earnings</h1><p className="mt-2 text-sm text-slate-500">Track what you have earned, collected in cash, and received in your bank account.</p></div><button type="button" onClick={() => { ledger.refresh(); summary.refresh(); }} disabled={ledger.loading || summary.loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={ledger.loading || summary.loading ? "animate-spin" : ""} />Refresh</button></header>

    {summary.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{summary.error}</p>}
    {ledger.data?.rows?.some(row => row.status === "settled" && row.payout?.provider_status === "processed") && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Payment completed: one or more washer payouts have been confirmed by the payment provider.</p>}
    <section aria-label="Earnings summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard icon={CircleDollarSign} title="Total earned" amount={summary.data?.earned} detail="Your share of completed, paid services" tone="green" />
      <SummaryCard icon={ArrowDownToLine} title="Money received" amount={summary.data?.received} detail={`${money(summary.data?.bankReceived)} to bank · ${money(summary.data?.cashReceived)} cash collected`} tone="green" />
      <SummaryCard icon={Clock3} title="Awaiting bank payout" amount={summary.data?.awaitingPayout} detail="Online payments pending settlement" tone="amber" />
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-bold text-slate-900">Earning history</h2><p className="mt-1 text-xs text-slate-500">Bank payouts are marked received after RazorpayX confirms settlement.</p></div><span className="text-xs font-medium text-slate-500">{ledger.data?.count || 0} records</span></div>
      {ledger.error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{ledger.error}</p>}
      {ledger.loading && !ledger.data && <div role="status" className="space-y-3 p-5"><span className="sr-only">Loading earning history</span>{[1, 2, 3].map(item => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>}
      {!ledger.loading && ledger.data?.rows?.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500"><tr>{["Booking", "Customer payment", "Payout method", "Service total", "Platform fee", "Your share", "Money status", "Received on", "Reference"].map(label => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{ledger.data.rows.map(row => <tr key={row.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{row.booking_id?.slice(0, 8).toUpperCase() || "Booking"}</p><p className="mt-1 text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "Date unavailable"}</p></td><td className="px-5 py-4 capitalize text-slate-600">{String(row.payment?.payment_method || "-").replaceAll("_", " ")}</td><td className="px-5 py-4 text-slate-600">{row.payout_method}</td><td className="px-5 py-4 tabular-nums text-slate-600">{money(row.gross_amount)}</td><td className="px-5 py-4 tabular-nums text-slate-600">{money(row.platform_commission)}</td><td className="px-5 py-4 font-bold tabular-nums text-slate-950">{money(row.washer_amount)}</td><td className="px-5 py-4"><StatusPill row={row} /><p className="mt-1 text-xs capitalize text-slate-500">{row.payout?.provider_status || row.payout?.status || ""}</p></td><td className="px-5 py-4 text-slate-600">{row.status === "settled" && (row.payout?.processed_at || row.settled_at) ? new Date(row.payout?.processed_at || row.settled_at).toLocaleDateString("en-IN") : row.payment?.status === "paid" && ["cod", "cash"].includes(String(row.payment.payment_method || "").toLowerCase()) ? "Collected" : "-"}</td><td className="px-5 py-4 text-xs text-slate-600">{row.payout?.provider_id || "-"}</td></tr>)}</tbody></table></div>}
      {!ledger.loading && ledger.data && ledger.data.rows.length === 0 && <div className="p-10 text-center"><Banknote size={28} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No earnings recorded yet</p><p className="mt-1 text-sm text-slate-500">Your service earnings will appear here after the customer payment is confirmed.</p></div>}
      <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm sm:px-6"><button disabled={page === 1 || ledger.loading} onClick={() => setPage(value => value - 1)} className="font-semibold text-green-700 disabled:text-slate-300">Previous</button><p className="text-xs text-slate-500">Page {page} · 25 per page</p><button disabled={!ledger.data || page * 25 >= ledger.data.count || ledger.loading} onClick={() => setPage(value => value + 1)} className="font-semibold text-green-700 disabled:text-slate-300">Next</button></footer>
    </section>
  </main>;
}
