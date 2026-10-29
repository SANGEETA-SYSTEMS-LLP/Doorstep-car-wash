const money = paise => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OperationHistory({ rows, kind, busy, perform }) {
  const filtered = rows || [];
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[780px] text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>{[kind === "payout" ? "Washer / reference" : "Customer / payment", "Method", "Amount", "Date", "Status", "Action"].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{filtered.map(row => <tr key={row.id} className="border-t border-slate-100">
        <td className="p-3">{kind === "payout" ? <><strong>{row.washer_name || "Washer"}</strong><br/><span className="text-xs text-slate-500">{row.washer_phone || "Phone not provided"}</span><br/><span className="text-xs text-slate-400">{row.provider_id || row.id}</span></> : <><strong>{row.customer_name || "Customer"}</strong><br/><span className="text-xs text-slate-500">{row.customer_phone || "Phone not provided"}</span><br/><span className="text-xs text-slate-400">Payment {row.payment_id || "record"}</span></>}</td>
        <td className="p-3">{row.payment_method || (kind === "payout" ? "RazorpayX" : "Razorpay")}</td>
        <td className="p-3 tabular-nums">{money(row.amount_paise)}</td>
        <td className="p-3">{row.payment_date ? new Date(row.payment_date).toLocaleString("en-IN") : "-"}</td>
        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${["Paid", "Payment Completed"].includes(row.payment_status) || row.status === "processed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{row.payment_status || row.status}</span><p className="mt-1 text-xs capitalize text-slate-500">{row.provider_status || "awaiting provider"}</p></td>
        <td className="p-3"><button type="button" disabled={busy} onClick={() => perform(`/finance/operations/${row.id}/reconcile`, {})} className="text-green-700 underline disabled:text-slate-400">{row.provider_id ? "Refresh status" : row.status === "reserved" ? "Submit reviewed draft" : "Retry same request"}</button>{row.status === "reserved" && <button type="button" disabled={busy} onClick={() => perform(`/finance/operations/${row.id}/cancel`, {})} className="ml-3 text-red-700 underline">Cancel draft</button>}</td>
      </tr>)}</tbody>
    </table>
    {!filtered.length && <p className="p-7 text-center text-sm text-slate-500">No {kind === "payout" ? "washer payments" : "refunds"} recorded on this page.</p>}
  </div>;
}
