import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../services/core/api";
export default function LinkExistingWasher() {
  const [washerId, setWasherId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [washer, setWasher] = useState(null);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setWasher(null);
    try { const result = await apiRequest("/supervisor/washers/link", { method: "POST", body: JSON.stringify({ washerId, name }) }); setWasher(result.washer); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5 rounded-2xl border border-green-200 bg-white p-5 sm:p-8">
    <div><h2 className="text-xl font-bold text-slate-900">Add an existing washer</h2><p className="mt-2 text-sm text-slate-600">Enter the washer ID and registered full name to link their existing account to you. Their password and verification status stay the same.</p></div>
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Washer ID *<input required value={washerId} onChange={e => setWasherId(e.target.value)} placeholder="WSH-... or washer record UUID" className="mt-2 w-full rounded-xl border p-3" /></label><label className="text-sm font-semibold">Registered full name *<input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label></fieldset>{error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Adding washer..." : "Add existing washer"}</button></form>
    {washer && <div role="status" className="rounded-xl bg-green-50 p-5"><h3 className="font-bold text-green-900">Washer linked successfully</h3><p className="mt-1 text-sm text-green-800">You only need to link this account once. The washer will appear automatically on eligible bookings when available.</p><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{[["Washer ID", washer.referenceId], ["Name", washer.name], ["Phone", washer.phone], ["Email", washer.email], ["Address", washer.current_address], ["Location", washer.location ? `${washer.location.latitude}, ${washer.location.longitude}` : null], ["Status", washer.status], ["Verification", washer.is_verified ? "Verified" : "Pending verification"], ["Service radius", `${washer.service_radius_km ?? 5} km`], ["Rating", washer.rating ?? 0], ["Completed jobs", washer.jobs_completed ?? 0]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value ?? "Not provided"}</dd></div>)}</dl><Link to="/supervisor/washers" className="mt-5 inline-block font-semibold text-green-700 underline">View washer directory</Link></div>}
  </section>;
}
