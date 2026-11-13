import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";

const financeRoles = ["accountant", "super_admin"];
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm";

export default function Invoice() {
  const params = useParams();
  const { profile } = useAuth();
  const isFinanceStaff = financeRoles.includes(profile?.role);
  const [bookingId, setBookingId] = useState(params.bookingId || "");
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [invoicePending, setInvoicePending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({ businessName: "doorstep car wash", businessAddress: "", environmentManaged: false });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!isFinanceStaff) return undefined;
    let active = true;
    setSettingsLoading(true);
    apiRequest("/finance/invoice-settings")
      .then(result => { if (active) setSettings(result.settings); })
      .catch(failure => { if (active) setSettingsError(failure.message || "Unable to load invoice settings."); })
      .finally(() => { if (active) setSettingsLoading(false); });
    return () => { active = false; };
  }, [isFinanceStaff]);

  async function load(event) {
    event.preventDefault();
    setBusy(true); setError(""); setInvoice(null); setInvoicePending(false);
    try { setInvoice((await apiRequest("/finance/invoices/" + encodeURIComponent(bookingId))).invoice); }
    catch (failure) {
      if (failure.status === 409 && /seller details are not configured/i.test(failure.message || "")) setInvoicePending(true);
      else setError(failure.message || "Unable to open invoice.");
    }
    finally { setBusy(false); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSettingsSaving(true); setSettingsError(""); setSettingsSaved(false);
    try {
      const result = await apiRequest("/finance/invoice-settings", {
        method: "PUT",
        body: JSON.stringify({ businessName: settings.businessName, businessAddress: settings.businessAddress }),
      });
      setSettings(result.settings); setSettingsSaved(true);
    } catch (failure) { setSettingsError(failure.message || "Unable to save invoice seller details."); }
    finally { setSettingsSaving(false); }
  }

  const snapshot = invoice?.snapshot;
  const booking = snapshot?.booking;

  return <section className="space-y-5">
    <style>{"@media print { body * { visibility: hidden; } #booking-invoice, #booking-invoice * { visibility: visible; } #booking-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; } }"}</style>
    <h1 className="text-2xl font-bold">Booking invoice</h1>

    {isFinanceStaff && <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-900">Invoice seller details</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">Enter the actual business name and address printed on new service invoices. Previously issued invoice snapshots stay unchanged.</p>
      {settingsLoading && <p role="status" className="mt-3 text-sm text-slate-600">Loading seller details…</p>}
      {settingsError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{settingsError}</p>}
      {settingsSaved && <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">Seller details saved. New invoices can now be issued.</p>}
      <form onSubmit={saveSettings} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Business name<input required minLength={2} maxLength={120} disabled={settingsLoading || settingsSaving} value={settings.businessName} onChange={event => setSettings({ ...settings, businessName: event.target.value })} className={inputClass} /></label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Complete business address<textarea required minLength={10} maxLength={500} rows={3} disabled={settingsLoading || settingsSaving} value={settings.businessAddress} onChange={event => setSettings({ ...settings, businessAddress: event.target.value })} className={inputClass} placeholder="Enter the business's real registered or operating address" /></label>
        <button disabled={settingsLoading || settingsSaving} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2">{settingsSaving ? "Saving…" : "Save seller details"}</button>
      </form>
    </section>}

    <form onSubmit={load} className="flex flex-col gap-3 sm:flex-row">
      <input aria-label="Booking UUID" required value={bookingId} onChange={event => setBookingId(event.target.value)} placeholder="Booking UUID" className="w-full rounded border p-3" />
      <button disabled={busy} className="rounded bg-green-700 px-5 text-white">{busy ? "Loading…" : "Open"}</button>
    </form>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}{isFinanceStaff && !settings.businessAddress && !settings.environmentManaged ? " Add the actual seller address above, then open the invoice again." : ""}</p>}
    {invoicePending && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">This service is complete, but its invoice is waiting for the business seller details to be configured by Finance. Please check again later or contact support.</p>}

    {invoice && <>
      <article id="booking-invoice" className="space-y-5 rounded-xl border bg-white p-8">
        <h2 className="text-2xl font-bold">Invoice INV-{String(invoice.invoice_number).padStart(8, "0")}</h2>
        <p>{snapshot.seller.name}<br />{snapshot.seller.address}</p>
        <p>Issued: {new Date(invoice.created_at).toLocaleDateString()} · Currency INR</p>
        <p>Customer: {snapshot.customerName}<br />{booking.service_address}</p>
        <p>Booking: {booking.booking_number} · Service date: {booking.scheduled_date}</p>
        <table className="w-full text-left"><tbody>{[["Service", booking.service_amount ?? booking.base_amount], ["Additional charge", booking.extra_charge], ["Platform fee", booking.platform_fee], ["Discount", -Number(booking.discount_amount || 0)], ["Tax recorded on booking", booking.tax_amount], ["Total", booking.total_amount]].map(([label, value]) => <tr key={label} className="border-b"><th className="py-2">{label}</th><td>{Number(value || 0).toFixed(2)}</td></tr>)}</tbody></table>
        <p>Service invoice. Payment and refund records are maintained separately. This document is not a GST tax invoice.</p>
      </article>
      <button type="button" onClick={() => window.print()} className="text-green-700 underline">Print / Save as PDF</button>
    </>}
  </section>;
}
