import { ArrowLeft, ArrowRight, Check, Clock3, Car, Droplets, Sparkles, ShieldCheck } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
const designs = [
 { Icon: Droplets, banner: "from-sky-100 to-cyan-50", icon: "bg-sky-600", border: "border-sky-500", tint: "bg-sky-50" },
 { Icon: Sparkles, banner: "from-violet-100 to-indigo-50", icon: "bg-violet-600", border: "border-violet-500", tint: "bg-violet-50" },
 { Icon: ShieldCheck, banner: "from-amber-100 to-orange-50", icon: "bg-amber-600", border: "border-amber-500", tint: "bg-amber-50" },
];
export default function SelectPackageContent({ booking, packages, loading, checking, error, navigate, selected, setSelected, handleContinue }) {
 const chosen=packages.find(pkg=>pkg.id===selected);
 return <div className="min-h-screen bg-slate-50"><BookingSteps currentStep={3}/>
 <main className="mx-auto max-w-7xl p-5 lg:p-8">
  <button onClick={()=>navigate("/customer/select-vehicle")} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/>Change vehicle</button>
  <div className="mt-7 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Wash packages</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Choose your car’s care</h1><p className="mt-3 max-w-xl text-slate-500">Compare service details, duration and price. Every option below matches your vehicle type.</p></div><div className="flex items-center gap-3 rounded-2xl border bg-white px-5 py-4"><Car className="text-blue-700"/><div><strong className="block">{booking.vehicle?.name || "Choose a vehicle"}</strong><span className="text-sm capitalize text-slate-500">{booking.vehicle?.type}</span></div></div></div>
  {loading&&<p role="status" className="mt-8">Loading packages for your vehicle…</p>}
  {error&&<p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
  {!loading&&!packages.length&&<div className="mt-8 rounded-2xl border border-dashed bg-white p-8 text-center"><h2 className="text-lg font-bold">No matching packages yet</h2><p className="mt-2 text-slate-500">No active packages are listed for {booking.vehicle?.type || "this vehicle"}. Choose another vehicle or contact support.</p><button onClick={()=>navigate("/customer/select-vehicle")} className="mt-4 text-blue-700 underline">Choose vehicle</button></div>}
  <div className="mt-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{packages.map((pkg,index)=>{
   const design=designs[index%designs.length], Icon=design.Icon, active=pkg.id===selected;
   return <button key={pkg.id} type="button" disabled={checking} aria-pressed={active} onClick={()=>setSelected(pkg.id)} className={"flex flex-col overflow-hidden rounded-3xl border-2 text-left transition disabled:opacity-60 "+(active?design.border+" shadow-lg":"border-slate-200 bg-white hover:border-slate-400")}>
    <div className={"flex w-full items-center justify-between bg-gradient-to-br p-6 "+design.banner}><span className={"flex h-14 w-14 items-center justify-center rounded-2xl text-white "+design.icon}><Icon size={28}/></span><span className={"flex h-8 w-8 items-center justify-center rounded-full border-2 "+(active?design.icon+" border-transparent text-white":"border-slate-300 bg-white")}>{active&&<Check size={19}/>}</span></div>
    <div className="flex w-full flex-1 flex-col bg-white p-6"><h2 className="text-xl font-bold">{pkg.name}</h2><div className="mt-4"><span className="text-3xl font-extrabold">₹{Number(pkg.price).toLocaleString("en-IN")}</span><span className="ml-2 text-sm text-slate-500">per wash</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2"><Clock3 size={14}/>{pkg.duration_minutes} minutes</span><span className="rounded-full bg-slate-100 px-3 py-2 capitalize">{pkg.vehicle_type}</span></div><div className="my-5 border-t"/><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Service details</p><p className="mt-2 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">{pkg.description || "Contact support for the full service inclusions."}</p><span className={"mt-6 block rounded-xl p-3 text-center text-sm font-bold "+(active?design.icon+" text-white":design.tint+" text-slate-800")}>{active?"Selected package":"Choose this package"}</span></div>
   </button>;
  })}</div>
  {!!packages.length&&<div className="sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"><div><p className="text-xs font-semibold uppercase text-slate-500">Your selection</p><p className="mt-1 font-bold">{chosen?.name||"Choose a package"}{chosen?" · ₹"+Number(chosen.price).toLocaleString("en-IN"):""}</p></div><button onClick={handleContinue} disabled={loading||checking||!chosen} className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{checking?"Checking package…":"Choose date & time"}<ArrowRight size={17}/></button></div>}
 </main></div>;
}
