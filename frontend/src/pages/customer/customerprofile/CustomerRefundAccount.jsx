import { useState } from "react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";

const blank = { method: "bank", name: "", accountNumber: "", confirmAccount: "", ifsc: "", vpa: "", confirmVpa: "" };
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm";

export default function CustomerRefundAccount() {
  const { data, error, loading, refresh } = useApi("/account/customer-refund-account");
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  async function save(event) {
    event.preventDefault();
    setMessage(""); setSaveError("");
    if (form.method === "bank" && form.accountNumber !== form.confirmAccount) return setSaveError("Account numbers do not match.");
    if (form.method === "upi" && form.vpa.trim().toLowerCase() !== form.confirmVpa.trim().toLowerCase()) return setSaveError("UPI IDs do not match.");
    setSaving(true);
    try {
      const body = form.method === "upi" ? { method: "upi", vpa: form.vpa.trim() } : { method: "bank", name: form.name.trim(), accountNumber: form.accountNumber, ifsc: form.ifsc.trim().toUpperCase() };
      await apiRequest("/account/customer-refund-account", { method: "PUT", body: JSON.stringify(body) });
      setForm(blank); setMessage("Refund account saved securely."); refresh();
    } catch (failure) { setSaveError(failure.message || "Unable to save refund account."); }
    finally { setSaving(false); }
  }

  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <h2 className="text-xl font-bold text-slate-950">Refund account details</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">Razorpay refunds normally return to the original payment method. If Accounts needs to arrange a fallback bank or UPI refund, these saved details will be available in masked form.</p>
    {loading && <p role="status" className="mt-4 text-sm text-slate-600">Loading saved account…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error} <button type="button" onClick={refresh} className="underline">Retry</button></p>}
    {data?.account && <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-900">Saved: {data.account.account_label}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {saveError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
    <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Refund destination
        <select value={form.method} disabled={saving || loading || Boolean(error)} onChange={event => setForm({ ...blank, method: event.target.value })} className={inputClass}><option value="bank">Bank account</option><option value="upi">UPI ID</option></select>
      </label>
      {form.method === "bank" ? <>
        <label className="text-sm font-semibold text-slate-700">Account holder name<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
        <label className="text-sm font-semibold text-slate-700">Account number<input required type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{1,34}" maxLength={34} value={form.accountNumber} onChange={event => setForm({ ...form, accountNumber: event.target.value.replace(/\D/g, "") })} className={inputClass} /></label>
        <label className="text-sm font-semibold text-slate-700">Confirm account number<input required type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{1,34}" maxLength={34} value={form.confirmAccount} onChange={event => setForm({ ...form, confirmAccount: event.target.value.replace(/\D/g, "") })} className={inputClass} /></label>
        <label className="text-sm font-semibold text-slate-700">IFSC code<input required maxLength={11} pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" autoCapitalize="characters" value={form.ifsc} onChange={event => setForm({ ...form, ifsc: event.target.value.toUpperCase() })} className={inputClass} /></label>
      </> : <>
        <label className="text-sm font-semibold text-slate-700">UPI ID<input required maxLength={256} pattern="[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}" autoCapitalize="none" autoComplete="off" value={form.vpa} onChange={event => setForm({ ...form, vpa: event.target.value })} className={inputClass} placeholder="name@bank" /></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Confirm UPI ID<input required maxLength={256} autoCapitalize="none" autoComplete="off" value={form.confirmVpa} onChange={event => setForm({ ...form, confirmVpa: event.target.value })} className={inputClass} /></label>
      </>}
      <button disabled={saving || loading || Boolean(error)} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Saving securely…" : "Save refund account"}</button>
    </form>
  </section>;
}
