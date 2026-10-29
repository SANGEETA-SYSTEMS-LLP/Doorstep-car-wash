import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Car } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import MonthlyPackageCards from "./MonthlyPackageCards";

function PackageSkeleton() {
  return <div role="status" aria-label="Loading one-time washes" className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
    <span className="sr-only">Loading one-time washes</span>
    {[0, 1].map(item => <div key={item} className="grid animate-pulse gap-4 bg-[#fbfcfb] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"><div><div className="h-4 w-40 rounded bg-slate-200"/><div className="mt-3 h-3 w-64 max-w-full rounded bg-slate-100"/><div className="mt-4 h-3 w-32 rounded bg-slate-100"/></div><div className="h-10 w-28 rounded bg-slate-200"/></div>)}
  </div>;
}

export default function SelectPackageContent({ booking, packages, monthlyPackages, monthlyLoading, monthlyError, loading, checking, error, navigate, selected, setSelected, handleContinue, handleMonthlyContinue }) {
  const [planType, setPlanType] = useState("once");
  const chosen = packages.find(pkg => pkg.id === selected);
  const vehicleLabel = [booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(" ") || booking.vehicle?.name || "Your vehicle";
  const defaultDescription = "Exterior cleaning for one registered vehicle. Interior cleaning, vacuuming, polishing, and detailing are not included.";

  return <div className="min-h-screen bg-slate-50">
    <BookingSteps currentStep={3}/>
    <main className="mx-auto min-w-0 max-w-[1440px] p-4 sm:p-6 lg:p-8">
      <button type="button" onClick={() => navigate("/customer/select-vehicle")} className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"><ArrowLeft size={17}/>Change vehicle</button>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Choose a service</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Car care, your way</h1></div>
        <div className="flex w-full min-w-0 max-w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:w-auto sm:min-w-[220px] sm:px-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><Car/></span><div className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Your vehicle</span><strong className="mt-0.5 block truncate text-sm text-slate-900">{vehicleLabel}</strong><span className="block truncate text-xs capitalize text-slate-500">{booking.vehicle?.type}{booking.vehicle?.seatingCapacity ? ` · ${booking.vehicle.seatingCapacity} seats` : ""}</span></div></div>
      </div>
      <div className="mt-7 inline-flex rounded-lg border border-slate-200 bg-[#fbfcfb] p-1" role="group" aria-label="Package type">
        {[ ["once", "One-time wash", Car], ["monthly", "Monthly plans", CalendarDays] ].map(([value, label, Icon]) => <button key={value} type="button" aria-pressed={planType === value} onClick={() => setPlanType(value)} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5 ${planType === value ? "bg-green-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon size={16}/>{label}</button>)}
      </div>

      {planType === "monthly" && <MonthlyPackageCards packages={monthlyPackages} loading={monthlyLoading} error={monthlyError} vehicleType={booking.vehicle?.type} checking={checking} onContinue={handleMonthlyContinue}/>}
      {planType === "once" && <>
        {loading && <PackageSkeleton/>}
        {error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {!loading && !error && !packages.length && <section className="mt-7 border border-dashed border-slate-300 bg-[#fbfcfb] p-8 text-center"><Car className="mx-auto text-slate-500"/><h2 className="mt-4 text-lg font-bold text-slate-900">No one-time washes available</h2><p className="mt-2 text-sm text-slate-600">The service team has not configured a wash for this vehicle yet. Contact support for help.</p><button type="button" onClick={() => navigate("/customer/select-vehicle")} className="mt-4 px-3 py-2 text-sm font-semibold text-slate-700 underline">Change vehicle</button></section>}
        {!loading && packages.length > 0 && <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
          {packages.map(pkg => {
            const active = pkg.id === selected;
            return <button key={pkg.id} type="button" disabled={checking} aria-pressed={active} onClick={() => setSelected(pkg.id)} className={`grid w-full gap-4 p-5 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 ${active ? "bg-[#edf3f4]" : "bg-[#fbfcfb] hover:bg-slate-100"}`}>
              <span className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">One-time exterior wash · {vehicleLabel}</span><span className="mt-1 block text-lg font-bold text-slate-950">{pkg.name}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{pkg.description || defaultDescription}</span></span>
                <span className="flex flex-wrap gap-2 text-xs text-slate-600"><span className="bg-slate-100 px-2.5 py-1.5">{pkg.duration_minutes} minutes</span><span className="bg-slate-100 px-2.5 py-1.5 capitalize">{pkg.vehicle_type}</span></span>
              </span>
              <span className="flex items-center justify-between gap-5 sm:justify-end"><span><span className="block text-xl font-bold tabular-nums text-slate-950">₹{Number(pkg.price).toLocaleString("en-IN")}</span><span className="text-xs text-slate-500">per wash · GST extra</span></span><span className={`min-w-24 rounded-md px-4 py-2.5 text-center text-sm font-semibold ${active ? "bg-green-900 text-white" : "border border-slate-300 text-slate-700"}`}>{active ? "Selected" : "Choose"}</span></span>
            </button>;
          })}
        </div>}
        {packages.length > 0 && <div className="sticky bottom-3 z-10 mt-8 flex flex-wrap items-center justify-between gap-4 border border-slate-300 bg-[#f8faf9] p-4 sm:p-5"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Your one-time wash</p><p className="mt-1 truncate font-semibold text-slate-900">{chosen?.name || "Choose a wash"}{chosen ? ` · ₹${Number(chosen.price).toLocaleString("en-IN")}` : ""}</p></div><button type="button" onClick={handleContinue} disabled={loading || checking || !chosen} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-green-900 px-5 py-3 text-sm font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6">{checking ? "Checking wash…" : "Choose date & time"}<ArrowRight size={17}/></button></div>}
      </>}
    </main>
  </div>;
}
