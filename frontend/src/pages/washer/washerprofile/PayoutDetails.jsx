import { useState } from "react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";

const emptyForm = { method: "bank", name: "", accountNumber: "", confirmAccount: "", ifsc: "", vpa: "", confirmVpa: "" };
const normalizeBankAccount = value => value.replace(/[\s-]/g, "");

export default function PayoutDetails() {
  const { data, loading, error, refresh } = useApi("/account/payout-account");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setMessage(""); setSaveError("");
    if (form.method === "bank" && normalizeBankAccount(form.accountNumber) !== normalizeBankAccount(form.confirmAccount)) { setSaveError("Account numbers do not match."); return; }
    if (form.method === "upi" && form.vpa.trim().toLowerCase() !== form.confirmVpa.trim().toLowerCase()) { setSaveError("UPI IDs do not match."); return; }
    setSaving(true);
    try {
      const account = form.method === "upi" ? { method: "upi", vpa: form.vpa.trim() } : { method: "bank", name: form.name, accountNumber: normalizeBankAccount(form.accountNumber), ifsc: form.ifsc.trim().toUpperCase() };
      await apiRequest("/account/payout-account", { method: "PUT", body: JSON.stringify(account) });
      setForm({ ...emptyForm, method: form.method });
      setMessage("Payout account saved. Your earnings will be paid through the platform’s payout process.");
      refresh();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  const bankFields = [["name", "Account holder name", "text", 100], ["accountNumber", "Bank account number", "password", 34], ["confirmAccount", "Confirm account number", "text", 34], ["ifsc", "IFSC code", "text", 11]];
  const upiFields = [["vpa", "UPI ID", "text", 256], ["confirmVpa", "Confirm UPI ID", "text", 256]];
  const fields = form.method === "upi" ? upiFields : bankFields;

  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <h2 className="text-xl font-bold">Payment & payout details</h2>
    <p className="mt-2 text-sm text-slate-600">Customers pay securely through Razorpay. Add the bank account or UPI ID where you want to receive your washer earnings.</p>
    {loading && <p role="status" className="mt-4">Loading payout account…</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error} <button type="button" className="underline" onClick={refresh}>Retry</button></p>}
    {data?.account && <p className="mt-4 rounded-xl bg-blue-50 p-4">Saved: {data.account.account_label}</p>}
    <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Payout method
        <select value={form.method} disabled={saving} onChange={event => setForm({ ...emptyForm, method: event.target.value })} className="mt-2 w-full rounded-xl border bg-white p-3"><option value="bank">Bank transfer (RazorpayX)</option><option value="upi">UPI (RazorpayX)</option></select>
      </label>
      {fields.map(([key, label, type, max]) => <label key={key} className="text-sm font-semibold">{label}
        <input required type={type} autoComplete="off" maxLength={max} disabled={saving} value={form[key]} inputMode={key.toLowerCase().includes("account") ? "numeric" : "text"} pattern={key === "accountNumber" || key === "confirmAccount" ? "[0-9]{1,34}" : key === "ifsc" ? "[A-Za-z]{4}0[A-Za-z0-9]{6}" : key.includes("vpa") ? "[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}" : undefined} onChange={event => setForm({ ...form, [key]: key === "accountNumber" || key === "confirmAccount" ? normalizeBankAccount(event.target.value) : event.target.value })} className="mt-2 w-full rounded-xl border p-3" />
      </label>)}
      {saveError && <p role="alert" className="text-red-700 sm:col-span-2">{saveError}</p>}
      {message && <p role="status" className="text-green-700 sm:col-span-2">{message}</p>}
      <button disabled={saving || loading || Boolean(error)} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save payout account"}</button>
    </form>
  </section>;
}
