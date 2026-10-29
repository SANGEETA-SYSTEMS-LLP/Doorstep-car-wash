import { useState } from "react";
import { ArrowRight, Droplets } from "lucide-react";

const plans = [
  { name: "Basic", washes: 4, key: "basic" },
  { name: "Standard", washes: 8, key: "standard" },
  { name: "Premium", washes: 12, key: "premium" },
];
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

function PlanSkeleton() {
  return <div role="status" className="mt-6 space-y-3" aria-label="Loading monthly plans">
    {[0, 1, 2].map(item => <div key={item} className="grid animate-pulse grid-cols-[1fr_auto] items-center gap-4 border-y border-slate-200 bg-[#fbfcfb] p-5">
      <div><div className="h-3 w-28 rounded bg-slate-200"/><div className="mt-3 h-5 w-40 rounded bg-slate-200"/><div className="mt-3 h-3 w-56 max-w-full rounded bg-slate-100"/></div><div className="h-10 w-28 rounded bg-slate-200"/>
    </div>)}
  </div>;
}

export default function MonthlyPackageCards({ packages = [], loading, error, vehicleType, checking, onContinue }) {
  const [selected, setSelected] = useState("standard");
  const selectedPlan = plans.find(plan => plan.key === selected);
  const selectedPackage = packages.find(pkg => pkg.name?.toLowerCase().startsWith(`${selectedPlan?.name} monthly plan`.toLowerCase()));
  if (loading) return <PlanSkeleton />;

  return <section className="mt-6" aria-label="Monthly car wash plans">
    <div className="flex flex-wrap items-center justify-between gap-5 border-y border-slate-300 bg-[#edf3f4] px-5 py-6 sm:px-7">
      <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-wide text-green-900">Monthly wash plans</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Exterior washes for your {vehicleType || "vehicle"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Choose a monthly wash allowance for one registered vehicle.</p></div>
      <div className="flex items-center gap-3 border-l border-slate-300 pl-4"><Droplets size={20} className="text-green-900"/><div><p className="text-xs text-slate-500">Billing frequency</p><p className="text-sm font-semibold text-slate-900">Monthly · INR</p></div></div>
    </div>
    {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!packages.length ? <p className="mt-4 border border-slate-300 bg-[#fbfcfb] p-5 text-sm text-slate-600">Monthly plans are not configured for {vehicleType || "this vehicle category"} yet. Please contact support.</p> : <>
      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {plans.map(plan => {
          const active = selected === plan.key;
          const planPackage = packages.find(pkg => pkg.name?.toLowerCase().startsWith(`${plan.name} monthly plan`.toLowerCase()));
          return <article key={plan.key} className={`grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 ${active ? "bg-[#edf3f4]" : "bg-[#fbfcfb]"}`}>
            <div className="grid gap-4 sm:grid-cols-[minmax(9rem,.7fr)_minmax(10rem,1fr)_minmax(10rem,1fr)] sm:items-center">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{plan.name} plan</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950">{planPackage ? money(Number(planPackage.price)) : "Unavailable"}{planPackage && <span className="ml-1 text-xs font-medium text-slate-500">/ month</span>}</p></div>
              <p className="text-sm font-semibold text-slate-800">{plan.washes} exterior washes <span className="block text-xs font-normal text-slate-500">per billing month</span></p>
              <p className="text-sm text-slate-600">For one registered {vehicleType || "vehicle"}</p>
            </div>
            <button type="button" disabled={!planPackage} aria-pressed={active} onClick={() => setSelected(plan.key)} className={`min-h-11 rounded-md px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${active ? "bg-green-900 text-white" : "border border-slate-300 bg-[#fbfcfb] text-slate-800 hover:bg-slate-100"}`}>{planPackage ? active ? "Selected" : `Choose ${plan.name}` : "Unavailable"}</button>
          </article>;
        })}
      </div>
      <div className="sticky bottom-3 z-10 mt-6 flex flex-wrap items-center justify-between gap-4 border border-slate-300 bg-[#f8faf9] p-4 sm:p-5">
        <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Your monthly plan</p><p className="mt-1 truncate font-semibold text-slate-900">{selectedPackage?.name || "Choose a plan"}{selectedPackage ? ` · ${money(Number(selectedPackage.price))}/month` : ""}</p></div>
        <button type="button" onClick={() => onContinue?.(selectedPackage)} disabled={!selectedPackage || checking} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-green-900 px-5 py-3 text-sm font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50">{checking ? "Checking plan…" : "Choose date & time"}<ArrowRight size={17}/></button>
      </div>
    </>}
  </section>;
}
