import LinkExistingWasher from "./LinkExistingWasher";
import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { apiRequest } from "../../../services/core/api";
import SignupAddress from "../../public/register/SignupAddress";

export default function AddWasher() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", serviceRadiusKm: "5" });
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState({});
  const [locationBusy, setLocationBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [washer, setWasher] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy || locationBusy) return;
    if (location.latitude == null || location.longitude == null) { setError("Search and select the washer's location on the map."); return; }
    setBusy(true); setError("");
    try {
      const result = await apiRequest("/supervisor/washers", { method: "POST", body: JSON.stringify({ ...form, location, serviceRadiusKm: Number(form.serviceRadiusKm) }) });
      setWasher(result.washer);
      setForm(current => ({ ...current, password: "" }));
      setShowPassword(false);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-5xl space-y-6">
    <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8"><div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border-[36px] border-white/[0.06]" /><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/10"><UserPlus size={23} /></span><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Washer management</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Add a washer</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Create an account with contact details and a service location. A unique washer ID is generated automatically.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300"><span className="inline-flex items-center gap-2"><MapPin size={15} className="text-cyan-300" />Saved service location</span><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-cyan-300" />Supervisor review before jobs</span></div></header>
    <LinkExistingWasher />
    {washer ? <div role="status" className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-emerald-950 shadow-sm sm:p-8"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm"><BadgeCheck size={27} /></span><h2 className="text-xl font-bold">Washer account created</h2><p className="text-sm text-emerald-900/80">{washer.name} · {washer.email} · {washer.phone}</p><div className="rounded-xl border border-emerald-100 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Washer ID</p><p className="mt-1 break-all font-mono font-bold text-slate-950">{washer.referenceId || washer.id}</p></div><p className="text-sm">{washer.current_address}</p><p className="text-sm font-semibold">Offline · Awaiting supervisor verification</p><p className="text-sm leading-6">The washer can now <Link to="/login" className="font-semibold underline">log in</Link> with this email address and the password you entered. Supervisor verification is required before going online or accepting jobs.</p><div className="flex flex-wrap gap-3 border-t border-emerald-200 pt-4"><Link to="/supervisor/washers" className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-white">View washer directory</Link><Link to="/supervisor/washers/review" className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-white">Review washer</Link><button onClick={() => { setWasher(null); setForm({ name: "", phone: "", email: "", password: "", serviceRadiusKm: "5" }); setLocation({}); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-white">Add another washer</button></div></div> :
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-8">
      <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2"><legend className="mb-4 text-lg font-bold tracking-tight text-slate-950">Washer details</legend>
        {[["name", "Full name", "text", "Washer's full name"], ["phone", "Phone number", "tel", "+91 98765 43210"], ["email", "Email address", "email", "washer@example.com"]].map(([key, label, type, placeholder]) => <label key={key} className="text-sm font-semibold text-slate-700">{label} *<input required type={type} maxLength={key === "name" ? 100 : key === "phone" ? 20 : 254} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:border-blue-500" /></label>)}
        <div className="text-sm font-semibold text-slate-700"><label htmlFor="washer-password">Password *</label><div className="mt-2 flex rounded-xl border border-slate-300"><input id="washer-password" required type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="At least 12 characters" className="min-w-0 flex-1 rounded-xl px-4 py-3 font-normal" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="px-4 text-blue-700">{showPassword ? "Hide" : "Show"}</button></div><p className="mt-2 text-xs font-normal text-slate-500">Use 12 to 128 characters.</p></div>
        <label className="text-sm font-semibold text-slate-700">Service radius (km) *<input required type="number" min="0.01" max="100" step="0.01" value={form.serviceRadiusKm} onChange={event => setForm({ ...form, serviceRadiusKm: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
      </fieldset>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5"><SignupAddress value={location} onChange={setLocation} disabled={busy} onBusy={setLocationBusy} accountType="washer" /></div>
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">The account starts offline and pending verification. The washer must complete verification before receiving jobs.</p>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <button disabled={busy || locationBusy} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950 disabled:opacity-50 sm:w-auto">{busy ? "Creating account..." : "Create washer account"}</button>
    </form>}
  </section>;
}
