import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { apiRequest } from "../../services/core/api";
const statuses = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
function Ticket({ ticket, refresh }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [note, setNote] = useState(ticket.resolution_note || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { await apiRequest("/support/" + ticket.id, { method: "PATCH", body: JSON.stringify({ status, priority, resolutionNote: note }) }); refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <article className="rounded-2xl border bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">{ticket.ticket_number} · {ticket.subject}</h2><span className="text-sm text-slate-500">{ticket.issue_type.replaceAll("_", " ")}</span></div><p className="mt-3 whitespace-pre-wrap text-slate-600">{ticket.description}</p><p className="mt-3 break-all text-xs text-slate-500">Booking: {ticket.booking_id || "Not linked"} · Created: {new Date(ticket.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
    <form onSubmit={save} className="mt-5 space-y-4"><div className="flex flex-wrap gap-4"><label className="text-sm">Status<select disabled={busy} value={status} onChange={e => setStatus(e.target.value)} className="ml-2 rounded border p-2">{statuses.map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm">Priority<select disabled={busy} value={priority} onChange={e => setPriority(e.target.value)} className="ml-2 rounded border p-2">{["low", "normal", "high", "urgent"].map(p => <option key={p}>{p}</option>)}</select></label></div><label className="block text-sm">Resolution note<textarea disabled={busy} maxLength={5000} value={note} onChange={e => setNote(e.target.value)} className="mt-2 block w-full rounded-lg border p-3" /></label>{error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">{busy ? "Saving…" : "Save ticket"}</button></form>
  </article>;
}
export default function SupportDashboard() {
  const [filter, setFilter] = useState("");
  const { data, loading, error, refresh } = useApi("/support/" + (filter ? "?status=" + filter : ""));
  return <section className="space-y-6"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-bold">Customer Support</h1><p className="mt-2 text-slate-500">Review complaints, set priorities and update resolutions.</p></div><button onClick={refresh} className="text-blue-700 underline">Refresh</button></div><label className="block">Ticket status <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded border bg-white p-2"><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label>{loading && <p role="status">Loading tickets…</p>}{error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}{!loading && !error && data?.tickets?.map(ticket => <Ticket key={ticket.id + ticket.updated_at} ticket={ticket} refresh={refresh} />)}{!loading && !error && data?.tickets?.length === 0 && <p>No tickets match this view.</p>}<Link to="/dashboard" className="inline-block text-blue-700">Back to dashboard</Link></section>;
}
