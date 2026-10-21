import { useState } from "react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";

export default function PayoutDetails() {
  const { data, loading, error, refresh } = useApi("/account/payout-account");
  const [form, setForm] = useState({ name: "", accountNumber: "", confirmAccount: "", ifsc: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setMessage(""); setSaveError("");
    if (form.accountNumber !== form.confirmAccount) { setSaveError("Account numbers do not match."); return; }
    setSaving(true);
    try {
      await apiRequest("/account/payout-account", { method: "PUT", body: JSON.stringify({ name: form.name, accountNumber: form.accountNumber, ifsc: form.ifsc }) });
      setForm({ name: "", accountNumber: "", confirmAccount: "", ifsc: "" });
      setMessage("Payout account saved. Your earnings will be paid through the platform’s payout process."); refresh();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }
  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <h2 className="text-xl font-bold">Payment & payout details</h2>
    <p className="mt-2 text-sm text-slate-600">Customers pay securely through Razorpay. Add the bank account where you want to receive your washer earnings.</p>
    {loading && <p role="status" className="mt-4">Loading payout account…</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error} <button type="button" className="underline" onClick={refresh}>Retry</button></p>}
    {data?.account && <p className="mt-4 rounded-xl bg-blue-50 p-4">Saved: {data.account.account_label}</p>}
    <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
      {[["name", "Account holder name", "text", 100], ["accountNumber", "Bank account number", "password", 18], ["confirmAccount", "Confirm account number", "text", 18], ["ifsc", "IFSC code", "text", 11]].map(([key, label, type, max]) => <label key={key} className="text-sm font-semibold">{label}
        <input required type={type} autoComplete="off" maxLength={max} disabled={saving} value={form[key]} inputMode={key.includes("Account") || key === "accountNumber" ? "numeric" : "text"} pattern={key === "accountNumber" || key === "confirmAccount" ? "[0-9]{9,18}" : key === "ifsc" ? "[A-Za-z]{4}0[A-Za-z0-9]{6}" : undefined} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-xl border p-3" />
      </label>)}
      {saveError && <p role="alert" className="text-red-700 sm:col-span-2">{saveError}</p>}
      {message && <p role="status" className="text-green-700 sm:col-span-2">{message}</p>}
      <button disabled={saving || loading || Boolean(error)} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save payout account"}</button>
    </form>
  </section>;
}
