import { useEffect, useState } from "react";
import { Banknote, RotateCcw, Users } from "lucide-react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";
import OperationHistory from "./OperationHistory";
import PendingWasherPayments from "./PendingWasherPayments";

const inputClass = "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const money = paise => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinanceOperations() {
  const [payoutPage, setPayoutPage] = useState(1);
  const [refundPage, setRefundPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payoutTarget, setPayoutTarget] = useState("");
  const [selectedWasher, setSelectedWasher] = useState(null);
  const [payoutDraft, setPayoutDraft] = useState(null);
  const [refundTarget, setRefundTarget] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundDraft, setRefundDraft] = useState(null);
  const [payout, setPayout] = useState(null);
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
      const providerStatus = String(result.status || "").toLowerCase();
      setMessage(result.kind === "payout"
        ? providerStatus === "processed"
          ? `Payment Completed · RazorpayX reference ${result.providerId || result.id}.`
          : `Payout submitted · ${result.status || "awaiting provider confirmation"}. The payment status will update when RazorpayX confirms settlement.`
        : `Saved${result.status ? ` · ${result.status}` : ""}.`);
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
        if (isPayout) { setPayoutDraft(null); setPayoutTarget(""); setSelectedWasher(null); setPayout(null); }
        else { setRefundDraft(null); setRefundTarget(""); setRefundAmount(""); setRefundReason(""); }
      }
      return;
    }
    const request = {
      id: crypto.randomUUID(),
      kind,
      targetId: isPayout ? payoutTarget : refundTarget,
      amount: isPayout ? undefined : refundAmount,
      reason: isPayout
        ? `Washer payout for ${selectedWasher?.washer_name || "washer"} · ${selectedWasher?.pending_earning_count || 0} eligible earnings`
        : refundReason.trim(),
      ...(isPayout ? { paymentMethod: payout?.selectedMode || "IMPS" } : {}),
    };
    const result = await perform("/finance/operations", { ...request, prepareOnly: true });
    if (result) {
      const prepared = { ...request, paymentMethod: result.paymentMethod || request.paymentMethod, amountPaise: result.amountPaise };
      if (isPayout) setPayoutDraft(prepared);
      else setRefundDraft(prepared);
    }
  }

  function reviewWasherPayout(row) {
    if (payoutDraft || busy) return;
    setPayoutTarget(row.washer_id);
    setSelectedWasher(row);
    setPayout(row.payment_destination ? { method: row.payment_method, destination: row.payment_destination, accountType: row.payout_account_type, selectedMode: row.payout_account_type === "vpa" ? "UPI" : "IMPS", availableMethods: row.available_payment_methods || [] } : null);
    document.getElementById("washer-payments")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const pagination = (currentPage, setCurrentPage, records) => <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4"><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(value => value - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {currentPage} · {records?.count || 0} records</span><button type="button" disabled={!records || currentPage * 25 >= records.count} onClick={() => setCurrentPage(value => value + 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div>;

  return <main className="mx-auto max-w-7xl space-y-7">
    <header><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Accounts · Admin and Accountant</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Payment confirmations</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Manage outgoing team payments and customer refunds in separate workspaces. Provider confirmation controls the final status.</p></header>
    {(pageError || message) && <p role={pageError ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${pageError ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-700"}`}>{message || pageError}</p>}

    <section id="washer-payments" aria-labelledby="washer-payments-heading" className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Users size={20} aria-hidden="true" /></span><div><h2 id="washer-payments-heading" className="text-xl font-bold text-slate-950">Washer and supervisor payments</h2><p className="mt-1 text-sm text-slate-600">Review pending washer earnings, payout method, and provider-confirmed settlement.</p></div></div>

      <PendingWasherPayments rows={payoutData?.rows} error={payoutError} busy={busy || Boolean(payoutDraft)} refresh={payoutRefresh} review={reviewWasherPayout} />

      <form onSubmit={event => submitOperation(event, "payout")} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h3 className="font-bold text-slate-900">Review washer payout</h3><p className="mt-1 text-sm text-slate-500">Select a washer above to load their saved payout method and pending earnings automatically.</p></div>
        {selectedWasher && <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 md:col-span-2"><strong>{selectedWasher.washer_name}</strong>{selectedWasher.washer_phone && <span> · {selectedWasher.washer_phone}</span>}<p className="mt-1">{payout?.method || "Payout method unavailable"} · {payout?.destination || "No payout destination saved"}</p><p className="mt-1">{selectedWasher.pending_earning_count || 0} eligible booking(s) · {money(Math.round(Number(selectedWasher.pending_total_amount || 0) * 100))}</p></div>}
        {payout?.availableMethods?.length > 0 && <label className="text-sm font-medium text-slate-700 md:col-span-2">Transfer method<select disabled={!!payoutDraft} value={payout.selectedMode} onChange={event => setPayout({ ...payout, selectedMode: event.target.value })} className={`${inputClass} mt-1.5`}>{payout.availableMethods.map(mode => <option key={mode} value={mode}>{mode === "UPI" ? "UPI" : `${mode} bank transfer`} via RazorpayX</option>)}</select></label>}
        {payoutDraft && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2">Review: {payoutDraft.paymentMethod} payout to {payout?.destination || "verified washer account"} · {money(payoutDraft.amountPaise)}. Confirm sends the transfer through RazorpayX.</p>}
        {selectedWasher && <button disabled={busy || !payoutTarget || !payout?.availableMethods?.length} className="rounded-lg bg-slate-900 p-3 font-bold text-white disabled:opacity-50">{busy ? "Processing…" : payoutDraft ? "Confirm and submit payout" : "Review payout"}</button>}
        {payoutDraft && <button type="button" disabled={busy} onClick={async () => { if (await perform(`/finance/operations/${payoutDraft.id}/cancel`, {})) setPayoutDraft(null); }} className="rounded-lg border border-slate-300 p-3 text-sm font-semibold text-slate-700">Cancel draft</button>}
      </form>

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
