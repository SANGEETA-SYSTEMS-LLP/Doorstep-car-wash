import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, MapPin } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const preview = [
  { label: "Location", title: "Choose where we should come", detail: "Use a saved address or select a service location on the map.", icon: MapPin },
  { label: "Schedule", title: "Pick a day and time", detail: "Choose an available appointment that fits your day.", icon: CalendarDays },
  { label: "Service updates", title: "Follow each job update", detail: "See assignment and service progress from your booking history.", icon: ClipboardList },
];

function HomeHero() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const active = preview[step];
  const PreviewIcon = active.icon;
  const bookingPath = user ? profile?.role === "customer" ? "/customer/select-location" : "/dashboard" : "/register?role=customer";
  const nextStep = () => setStep(current => (current + 1) % preview.length);
  return <>
    <section className="bg-[#edf3f4]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_.9fr] lg:gap-16 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">Doorstep car wash · WashNow</p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.6rem]">A clean car, on a day that works for you.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">Choose a service location, vehicle and time. Follow the booking as a local supervisor assigns an available washer.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={bookingPath} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-800 px-6 py-3 text-sm font-semibold text-white hover:bg-green-900">Book a wash</Link>
            <Link to="/register?role=washer" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-400 bg-transparent px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-white">Apply as a washer</Link>
          </div>
          <p className="mt-4 text-xs text-slate-600">Already registered? <Link to="/login" className="font-semibold text-green-900 underline">Sign in</Link>. Washer accounts need supervisor approval.</p>
        </div>
        <section aria-label="Interactive booking walkthrough preview" className="border border-slate-300 bg-[#f8faf9] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Booking walkthrough</p>
            <span className="text-xs text-slate-500">Step {step + 1} of {preview.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 py-3" role="group" aria-label="Choose a walkthrough step">
            {preview.map((item, index) => <button key={item.label} type="button" aria-pressed={step === index} onClick={() => setStep(index)} className={`min-h-10 px-3 text-xs font-semibold ${step === index ? "border-b-2 border-green-700 text-green-800" : "text-slate-600 hover:text-slate-950"}`}>{item.label}</button>)}
          </div>
          <div id="booking-walkthrough-preview" className="min-h-64 py-6" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-green-100 bg-green-50 text-green-800"><PreviewIcon size={19} aria-hidden="true" /></span>
              <div><h2 className="text-xl font-bold tracking-tight text-slate-950">{active.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{active.detail}</p></div>
            </div>
            {step === 0 && <div className="mt-6 border-y border-slate-200 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location selection</p><p className="mt-2 font-semibold text-slate-900">Search an address or choose a point on the map</p><p className="mt-1 text-sm text-slate-600">Service availability is checked before the booking continues.</p></div>}
            {step === 1 && <div className="mt-6 border-y border-slate-200 py-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Appointment selection</p><p className="mt-2 font-semibold text-slate-900">Pick a date to view available times</p><div className="mt-3 flex flex-wrap gap-2">{["Morning", "Afternoon", "Evening"].map(period => <span key={period} className="border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600">{period}</span>)}</div></div>}
            {step === 2 && <ol className="mt-6 divide-y divide-slate-200 border-y border-slate-200">{["Booking details are saved", "Supervisor reviews washer availability", "Assignment and service updates appear in your account"].map((item, index) => <li key={item} className="flex items-start gap-3 py-3"><span className="text-xs font-bold tabular-nums text-green-800">0{index + 1}</span><span className="text-sm leading-5 text-slate-700">{item}</span></li>)}</ol>}
            <button type="button" aria-controls="booking-walkthrough-preview" onClick={nextStep} className="mt-5 text-sm font-semibold text-green-800 underline underline-offset-4">Explore next step</button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p className="max-w-sm text-xs text-slate-500">Walk through the steps here. Your real booking starts after sign-in.</p>
            <Link to={bookingPath} className="text-sm font-semibold text-green-800 underline underline-offset-4">Start a real booking</Link>
          </div>
        </section>
      </div>
    </section>
    <section className="border-b border-slate-200 bg-[#f8faf9]">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-10 gap-y-3 px-5 py-5 text-sm text-slate-700 sm:px-8 lg:px-10">
        <span><strong className="text-slate-950">01</strong> &nbsp; Choose a service location</span><span><strong className="text-slate-950">02</strong> &nbsp; Select a vehicle and wash</span><span><strong className="text-slate-950">03</strong> &nbsp; Follow assignment updates</span>
      </div>
    </section>
  </>;
}
export default HomeHero;
