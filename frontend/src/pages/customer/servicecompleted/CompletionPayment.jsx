import { useState } from "react";
import useApi from "../../../hooks/useApi";
import { getBookingById } from "../../../services/booking/bookingService";
import { openRazorpayPayment } from "../payment/paymentHelpers";

export default function CompletionPayment({ bookingId, onPaid }) {
  const { data, error, loading, refresh } = useApi(`/payments/bookings/${encodeURIComponent(bookingId)}/options`);
  const [busy, setBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  async function pay() {
    if (busy || !data || data.paid) return;
    setBusy(true); setPaymentError("");
    try {
      await openRazorpayPayment(data.booking, async () => {
        refresh();
        const updated = await getBookingById(bookingId);
        onPaid(updated.status);
      }, setPaymentError, () => setBusy(false));
    } catch (err) { setPaymentError(err.message); setBusy(false); }
  }
  return <section className="mt-6 rounded-2xl border bg-white p-6">
    <h2 className="text-xl font-bold">Service payment</h2>
    {loading && <p role="status" className="mt-3">Loading payment options…</p>}
    {error && <p role="alert" className="mt-3 text-red-700">{error} <button className="underline" onClick={refresh}>Retry</button></p>}
    {data && <>
      <p className="mt-3">Washer: <strong>{data.washerName}</strong></p>
      <p className="mt-2 text-sm text-slate-600">Payment is optional. Pay securely through Razorpay if you choose; the platform handles your washer’s payout.</p>
      {data.paid ? <p role="status" className="mt-4 font-semibold text-green-700">Payment received. No further payment is needed.</p> : <button disabled={busy || !["customer_confirmed", "closed"].includes(data.booking.status)} onClick={pay} className="mt-5 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Processing…" : `Pay ₹${Number(data.booking.total_amount).toLocaleString("en-IN")} with Razorpay`}</button>}
    </>}
    {paymentError && <p role="alert" className="mt-3 text-red-700">{paymentError}</p>}
  </section>;
}
