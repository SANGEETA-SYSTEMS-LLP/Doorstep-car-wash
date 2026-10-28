import { useState } from "react";
import { BadgeCheck, Check, Droplets, Sparkles, ArrowRight } from "lucide-react";

const plans = [
  { name: "Basic", washes: 4, key: "basic" },
  { name: "Standard", washes: 8, key: "standard", featured: true },
  { name: "Premium", washes: 12, key: "premium" },
];

const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(value);

export default function MonthlyPackageCards({ packages = [], loading, error, vehicleType, checking, onContinue }) {
  const [selected, setSelected] = useState("standard");
  const selectedPlan = plans.find(plan => plan.key === selected);
  const selectedPackage = packages.find(pkg => pkg.name?.toLowerCase().startsWith(`${selectedPlan?.name} monthly plan`.toLowerCase()));

  if (loading) return <div role="status" className="mt-6 grid gap-4 md:grid-cols-3"><span className="sr-only">Loading subscription plans</span>{plans.map(plan => <div key={plan.key} className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />)}</div>;
  return <section className="mt-6" aria-label="Monthly car wash subscription plans">
    <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200"><Sparkles size={14} />Monthly membership</span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">A cleaner car, all month long</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Choose a monthly wash allowance for your {vehicleType || "vehicle"}. Every plan covers exterior washes for one registered vehicle.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Droplets size={19} /></span>
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Billed</p><p className="mt-0.5 text-sm font-bold">Monthly · INR</p></div>
        </div>
      </div>
    </div>

    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!packages.length ? <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">Monthly plans are not configured for {vehicleType || "this vehicle category"} yet. Please contact support.</p> : <>
      <div className="mt-5 grid items-stretch gap-4 md:grid-cols-3">
        {plans.map(plan => {
          const active = selected === plan.key;
          const planPackage = packages.find(pkg => pkg.name?.toLowerCase().startsWith(`${plan.name} monthly plan`.toLowerCase()));
          return <article key={plan.key} className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white transition ${active ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-400"}`}>
            {plan.featured && <div className="flex items-center justify-center gap-1.5 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white"><BadgeCheck size={14} />Most popular</div>}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{plan.name} plan</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{planPackage ? money(Number(planPackage.price)) : "Unavailable"}{planPackage && <span className="ml-1 text-sm font-medium text-slate-500">/ month</span>}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-full border ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-transparent"}`}><Check size={16} /></span></div>
              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3"><p className="text-lg font-bold text-slate-900">{plan.washes} exterior washes</p><p className="mt-0.5 text-xs text-slate-500">per billing month</p></div>
              <ul className="mt-5 space-y-3 text-sm text-slate-600"><li className="flex gap-2"><Check size={17} className="shrink-0 text-slate-700" />For one registered {vehicleType || "vehicle"}</li><li className="flex gap-2"><Check size={17} className="shrink-0 text-slate-700" />One wash cleans the vehicle exterior</li></ul>
              <button type="button" disabled={!planPackage} aria-pressed={active} onClick={() => setSelected(plan.key)} className={`mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{active && <Check size={16} />}{planPackage ? active ? "Selected plan" : `Choose ${plan.name}` : "Unavailable"}</button>
            </div>
          </article>;
        })}
      </div>
      <div className="sticky bottom-3 z-10 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Your monthly plan</p><p className="mt-1 truncate font-semibold text-slate-900">{selectedPackage?.name || "Choose a plan"}{selectedPackage ? ` · ${money(Number(selectedPackage.price))}/month` : ""}</p></div>
        <button type="button" onClick={() => onContinue?.(selectedPackage)} disabled={!selectedPackage || checking} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6">{checking ? "Checking plan…" : "Choose date & time"}<ArrowRight size={17} /></button>
      </div>
    </>}
  </section>;
}
