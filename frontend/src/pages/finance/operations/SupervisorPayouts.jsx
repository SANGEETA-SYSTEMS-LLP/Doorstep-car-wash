import { useState } from "react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";

const inr = amount => `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SupervisorPayouts() {
  const { data, error, refresh } = useApi("/finance/supervisor-payouts");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState(null);

  async function pay() {
    if (!selected || !mode || busy) return;
    setBusy(true); setMessage("");
    const id = requestId || crypto.randomUUID();
    setRequestId(id);
    try {
      const result = await apiRequest("/finance/supervisor-payouts/pay", { method: "POST", body: JSON.stringify({
        id, supervisorId: selected.supervisor_id, paymentMethod: mode,
      }) });
      setMessage(result.simulated ? "Simulation submitted; no money moved." : `Supervisor payout submitted · RazorpayX reference ${result.providerId}.`);
      setSelected(null); setMode(""); setRequestId(null); refresh();
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <div><h3 className="font-bold text-slate-900">Supervisor commission payouts</h3><p className="mt-1 text-sm text-slate-500">Each linked supervisor receives the same package commission as the washer on eligible completed, paid jobs.</p></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    {!data?.rows?.length && !error && <p className="text-sm text-slate-500">No pending supervisor commissions.</p>}
    <div className="space-y-2">{(data?.rows || []).map(row => <div key={row.supervisor_id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${selected?.supervisor_id === row.supervisor_id ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
      <div><p className="font-semibold text-slate-900">{row.supervisor_name}</p><p className="text-sm text-slate-600">{row.payment_method} · {row.payment_destination || "Payout account not saved"}</p><p className="mt-1 text-xs text-slate-500">{row.pending_earning_count} eligible job(s) · Supervisor commission {inr(row.pending_total_amount)}</p><p className="text-xs text-slate-500">Admin retains platform fee {inr(row.admin_platform_fee_amount)} + GST {inr(row.admin_gst_amount)}</p></div>
      <button type="button" disabled={!row.available_payment_methods?.length || busy || Boolean(requestId && selected?.supervisor_id !== row.supervisor_id)} onClick={() => { if (selected?.supervisor_id !== row.supervisor_id) setRequestId(null); setSelected(row); setMode(row.available_payment_methods[0] || ""); }} className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-800 disabled:opacity-40">Select</button>
    </div>)}</div>
    {selected && <div className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-4">
      <label className="text-sm font-medium text-slate-700">Transfer method<select disabled={Boolean(requestId)} value={mode} onChange={event => setMode(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white p-2 disabled:bg-slate-100">{selected.available_payment_methods.map(value => <option key={value} value={value}>{value === "UPI" ? "UPI" : `${value} bank transfer`} via RazorpayX</option>)}</select></label>
      <button type="button" disabled={busy || !mode} onClick={pay} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Sending…" : requestId ? `Retry same payout · ${inr(selected.pending_total_amount)}` : `Pay supervisor · ${inr(selected.pending_total_amount)}`}</button>
    </div>}
  </section>;
}
