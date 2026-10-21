import { useEffect, useState } from "react";
import { Banknote, RefreshCw, RotateCcw, Users } from "lucide-react";
import useApi from "../../hooks/useApi";
import { apiRequest } from "../../api/apiClient";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const money = paise => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function OperationHistory({ rows, kind, busy, perform }) {
  const filtered = rows || [];
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[780px] text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>{[kind === "payout" ? "Washer / reference" : "Customer / payment", "Method", "Amount", "Date", "Status", "Action"].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{filtered.map(row => <tr key={row.id} className="border-t border-slate-100">
        <td className="p-3">{kind === "payout" ? <><strong>{row.washer_name || "Washer"}</strong><br/><span className="text-xs text-slate-500">{row.washer_phone || "Phone not provided"}</span><br/><span className="text-xs text-slate-400">{row.provider_id || row.id}</span></> : <><strong>{row.customer_name || "Customer"}</strong><br/><span className="text-xs text-slate-500">{row.customer_phone || "Phone not provided"}</span><br/><span className="text-xs text-slate-400">Payment {row.payment_id || "record"}</span></>}</td>
        <td className="p-3">{row.payment_method || (kind === "payout" ? "Bank transfer (RazorpayX)" : "Razorpay")}</td>
        <td className="p-3 tabular-nums">{money(row.amount_paise)}</td>
        <td className="p-3">{row.payment_date ? new Date(row.payment_date).toLocaleString("en-IN") : "—"}</td>
        <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payment_status === "Paid" || row.status === "processed" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{row.payment_status || row.status}</span><p className="mt-1 text-xs capitalize text-slate-500">{row.provider_status || "awaiting provider"}</p></td>
        <td className="p-3"><button type="button" disabled={busy} onClick={() => perform(`/finance/operations/${row.id}/reconcile`, {})} className="text-blue-700 underline disabled:text-slate-400">{row.provider_id ? "Refresh status" : row.status === "reserved" ? "Submit reviewed draft" : "Retry same request"}</button>{row.status === "reserved" && <button type="button" disabled={busy} onClick={() => perform(`/finance/operations/${row.id}/cancel`, {})} className="ml-3 text-red-700 underline">Cancel draft</button>}</td>
      </tr>)}</tbody>
    </table>
    {!filtered.length && <p className="p-7 text-center text-sm text-slate-500">No {kind === "payout" ? "washer payments" : "refunds"} recorded on this page.</p>}
  </div>;
}

export default function FinanceOperations() {
  const [payoutPage, setPayoutPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payoutTarget, setPayoutTarget] = useState("");
  const [payoutReason, setPayoutReason] = useState("");
  const [payoutDraft, setPayoutDraft] = useState(null);
  const [refundTarget, setRefundTarget] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundDraft, setRefundDraft] = useState(null);
  const [payout, setPayout] = useState(null);
  const [checkingPayout, setCheckingPayout] = useState(false);
  const [account, setAccount] = useState({ washerId: "", fundAccountId: "", label: "" });
  const { data: payoutOperations, error: payoutOperationsError, refresh: payoutOperationsRefresh } = useApi(`/finance/operations?kind=payout&page=${payoutPage}`);
  const { data: refundOperations, error: refundOperationsError, refresh: refundOperationsRefresh } = useApi(`/finance/operations?kind=refund&page=${refundPage}`);
  const { data: payoutData, error: payoutError, refresh: payoutRefresh } = useApi(`/finance/washer-payouts?status=pending&page=${payoutPage}`);
  const pageError = payoutOperationsError || refundOperationsError || payoutError;

  useEffect(() => {
    const timer = setInterval(() => { payoutOperationsRefresh(); refundOperationsRefresh(); payoutRefresh(); }, 30000);
    return () => clearInterval(timer);
  }, [payoutOperationsRefresh, refundOperationsRefresh, payoutRefresh]);

  async function perform(path, body, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest(path, { method, body: JSON.stringify(body) });
      setMessage(`Saved${result.status ? ` · ${result.status}` : ""}.`);
      payoutOperationsRefresh();
      refundOperationsRefresh();
      payoutRefresh();
      return result;
    } catch (requestError) {
      setMessage(requestError.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitOperation(event, kind) {
    event.preventDefault();
    const isPayout = kind === "payout";
    const draft = isPayout ? payoutDraft : refundDraft;
    if (draft) {
      if (await perform("/finance/operations", draft)) {
        if (isPayout) { setPayoutDraft(null); setPayoutTarget(""); setPayoutReason(""); }
        else { setRefundDraft(null); setRefundTarget(""); setRefundAmount(""); setRefundReason(""); }
      }
      return;
    }
    const request = {
      id: crypto.randomUUID(),
      kind,
      targetId: isPayout ? payoutTarget : refundTarget,
      amount: isPayout ? undefined : refundAmount,
      reason: (isPayout ? payoutReason : refundReason).trim(),
    };
    const result = await perform("/finance/operations", { ...request, prepareOnly: true });
    if (result) {
      const prepared = { ...request, amountPaise: result.amountPaise };
      if (isPayout) setPayoutDraft(prepared);
      else setRefundDraft(prepared);
    }
  }

  function reviewWasherPayout(row) {
    setPayoutTarget(row.washer_id);
    setPayoutReason(`Washer payout for ${row.washer_name} · earning ${row.id}`);
    setPayout(row.payment_destination ? { method: row.payment_method, destination: row.payment_destination } : null);
    document.getElementById("washer-payments")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function checkPayout() {
    setCheckingPayout(true);
    setPayout(null);
    try {
      const result = await apiRequest(`/finance/payout-account/${encodeURIComponent(payoutTarget)}`);
      setPayout(result.payout || { method: "Not configured", destination: null });
    } catch (requestError) { setMessage(requestError.message); }
    finally { setCheckingPayout(false); }
  }

  const pagination = (currentPage, setCurrentPage, records) => <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4"><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(value => value - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {currentPage} · {records?.count || 0} records</span><button type="button" disabled={!records || currentPage * 25 >= records.count} onClick={() => setCurrentPage(value => value + 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>;

  return <main className="mx-auto max-w-7xl space-y-7">
    <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Accounts · Admin and Accountant</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Payment confirmations</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Manage outgoing team payments and customer refunds in separate workspaces. Provider confirmation controls the final status.</p></header>
    {(pageError || message) && <p role={pageError ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${pageError ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700"}`}>{message || pageError}</p>}

    <section id="washer-payments" aria-labelledby="washer-payments-heading" className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Users size={20} aria-hidden="true" /></span><div><h2 id="washer-payments-heading" className="text-xl font-bold text-slate-950">Washer and supervisor payments</h2><p className="mt-1 text-sm text-slate-600">Review pending washer earnings, payout method, and provider-confirmed settlement.</p></div></div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h3 className="font-bold text-slate-900">Pending washer payments</h3><p className="mt-1 text-sm text-slate-500">Includes washer identity, customer payment status, masked payout destination, and amount.</p></div><button type="button" onClick={payoutRefresh} disabled={busy} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 disabled:opacity-50"><RefreshCw size={15} />Refresh</button></div>{payoutError && <p role="alert" className="p-4 text-sm text-red-700">{payoutError}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Washer", "Customer payment", "Payout method", "Amount", "Status", "Action"].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead><tbody>{(payoutData?.rows || []).map(row => <tr key={row.id} className="border-t border-slate-100"><td className="p-3"><strong>{row.washer_name}</strong><br/><span className="text-xs text-slate-500">{row.washer_phone || "Phone not provided"} · Booking {row.booking_id?.slice(0, 8)}</span></td><td className="p-3 capitalize">{String(row.customer_payment_method).replaceAll("_", " ")}<br/><span className="text-xs text-slate-500">{row.customer_payment_status}</span></td><td className="p-3">{row.payment_method}<br/><span className="text-xs text-slate-500">{row.payment_destination || "No payout destination saved"}</span></td><td className="p-3 tabular-nums">₹{Number(row.washer_amount || 0).toFixed(2)}</td><td className="p-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{row.payment_status}</span></td><td className="p-3"><button type="button" disabled={busy || !row.payout_eligible} onClick={() => reviewWasherPayout(row)} className="text-blue-700 underline disabled:text-slate-400">{!row.payment_destination ? "Link bank first" : row.payout_eligible ? "Review payout" : "Await customer payment"}</button></td></tr>)}</tbody></table></div>{payoutData?.rows?.length === 0 && <p className="p-7 text-center text-sm text-slate-500">No pending washer payments.</p>}</div>

      <form onSubmit={event => submitOperation(event, "payout")} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h3 className="font-bold text-slate-900">Review washer payout</h3><p className="mt-1 text-sm text-slate-500">A review is required before the request is sent to RazorpayX.</p></div>
        <label className="text-sm font-medium text-slate-700">Washer record UUID<input required disabled={!!payoutDraft} className={`${inputClass} mt-1.5`} value={payoutTarget} onChange={event => { setPayoutTarget(event.target.value); setPayout(null); }} /></label>
        <label className="text-sm font-medium text-slate-700">Reason<input required minLength={3} maxLength={500} disabled={!!payoutDraft} className={`${inputClass} mt-1.5`} value={payoutReason} onChange={event => setPayoutReason(event.target.value)} /></label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2"><button type="button" disabled={checkingPayout || !payoutTarget || !!payoutDraft} onClick={checkPayout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">{checkingPayout ? "Checking…" : "Check payout method"}</button>{payout && <p role="status" className="text-sm text-slate-700">{payout.method || "Bank transfer (RazorpayX)"} · {payout.destination || "No payout destination saved"}</p>}</div>
        {payoutDraft && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">Review: washer payout · {payoutDraft.targetId} · {money(payoutDraft.amountPaise)}. Confirm sends this payout request to the provider.</p>}
        <button disabled={busy || !payoutTarget} className="rounded-lg bg-slate-900 p-3 font-bold text-white disabled:opacity-50">{busy ? "Processing…" : payoutDraft ? "Confirm and submit payout" : "Review payout"}</button>
        {payoutDraft && <button type="button" disabled={busy} onClick={async () => { if (await perform(`/finance/operations/${payoutDraft.id}/cancel`, {})) setPayoutDraft(null); }} className="rounded-lg border border-slate-300 p-3 text-sm font-semibold text-slate-700">Cancel draft</button>}
      </form>

      <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-900">Link a washer’s RazorpayX bank account</summary><p className="my-3 text-sm text-slate-600">Verify the beneficiary in RazorpayX first. Only the masked destination is displayed in the dashboards.</p><form onSubmit={event => { event.preventDefault(); perform("/finance/payout-account", account, "PUT"); }} className="grid gap-3 md:grid-cols-3">{[["washerId", "Washer UUID"], ["fundAccountId", "Fund account ID (fa_…)"], ["label", "Account label"]].map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input required className={`${inputClass} mt-1.5`} value={account[key]} onChange={event => setAccount({ ...account, [key]: event.target.value })} /></label>)}<button disabled={busy} className="rounded-lg bg-slate-900 p-3 text-sm font-bold text-white md:col-span-3">Verify and link bank account</button></form></details>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-900">Washer payout records</h3><p className="mt-1 text-sm text-slate-500">Pending, processed, and reconciled transfers.</p></div>{payoutOperationsError && <p role="alert" className="p-4 text-sm text-red-700">{payoutOperationsError}</p>}<OperationHistory rows={payoutOperations?.rows} kind="payout" busy={busy} perform={perform} />{pagination(payoutPage, setPayoutPage, payoutOperations)}</div>

      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-white p-2 text-amber-700"><Banknote size={18} /></span><div><h3 className="font-bold text-amber-950">Supervisor payments</h3><p className="mt-1 text-sm leading-6 text-amber-900">Supervisor payout accounts and settlement records are not configured in this app yet. No supervisor payments can be initiated or marked paid from this page until that workflow is added.</p></div></div></aside>
    </section>

    <section aria-labelledby="customer-refunds-heading" className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><RotateCcw size={20} aria-hidden="true" /></span><div><h2 id="customer-refunds-heading" className="text-xl font-bold text-slate-950">Customer refunds</h2><p className="mt-1 text-sm text-slate-600">Review and submit refunds against eligible Razorpay payments.</p></div></div>
      <form onSubmit={event => submitOperation(event, "refund")} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h3 className="font-bold text-slate-900">Review customer refund</h3><p className="mt-1 text-sm text-slate-500">Check the amount and reason before submitting. Provider confirmation updates the final status.</p></div>
        <label className="text-sm font-medium text-slate-700">Payment record UUID<input required disabled={!!refundDraft} className={`${inputClass} mt-1.5`} value={refundTarget} onChange={event => setRefundTarget(event.target.value)} /></label>
        <label className="text-sm font-medium text-slate-700">Refund amount (INR)<input required disabled={!!refundDraft} type="number" min="1" step="0.01" className={`${inputClass} mt-1.5`} value={refundAmount} onChange={event => setRefundAmount(event.target.value)} /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Reason<input required minLength={3} maxLength={500} disabled={!!refundDraft} className={`${inputClass} mt-1.5`} value={refundReason} onChange={event => setRefundReason(event.target.value)} /></label>
        {refundDraft && <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900 md:col-span-2">Review: customer refund · {refundDraft.targetId} · {money(refundDraft.amountPaise)}. Confirm sends this refund request to Razorpay.</p>}
        <button disabled={busy || !refundTarget} className="rounded-lg bg-blue-700 p-3 font-bold text-white disabled:opacity-50">{busy ? "Processing…" : refundDraft ? "Confirm and submit refund" : "Review refund"}</button>
        {refundDraft && <button type="button" disabled={busy} onClick={async () => { if (await perform(`/finance/operations/${refundDraft.id}/cancel`, {})) setRefundDraft(null); }} className="rounded-lg border border-slate-300 p-3 text-sm font-semibold text-slate-700">Cancel draft</button>}
      </form>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-900">Customer refund records</h3><p className="mt-1 text-sm text-slate-500">Refund amount, payment reference, processing date, and provider status.</p></div>{refundOperationsError && <p role="alert" className="p-4 text-sm text-red-700">{refundOperationsError}</p>}<OperationHistory rows={refundOperations?.rows} kind="refund" busy={busy} perform={perform} />{pagination(refundPage, setRefundPage, refundOperations)}</div>
    </section>
  </main>;
}
