import { useState } from "react";
import { requestWasherExtraCharge } from "../../../services/booking/extraChargeService";

export default function ExtraChargeRequest({ bookingId }) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await requestWasherExtraCharge(bookingId, reason.trim(), Number(amount));
      setMessage("Request sent. Wait for supervisor and customer approval before doing additional work.");
      setReason(""); setAmount("");
    } catch (error) { setMessage(error.message || "Unable to request extra charge."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="rounded-3xl border border-amber-200 bg-amber-50 p-6 space-y-3">
    <h3 className="font-bold">Need an extra charge?</h3>
    <p className="text-sm">Additional work requires supervisor and customer approval.</p>
    <label className="block">Reason<textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="block w-full rounded border p-2" /></label>
    <label className="block">Amount (₹)<input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="block w-full rounded border p-2" /></label>
    <button disabled={busy || !reason.trim()} className="rounded-xl bg-white p-3 font-bold disabled:opacity-50">{busy ? "Sending..." : "Request Extra Charge"}</button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
