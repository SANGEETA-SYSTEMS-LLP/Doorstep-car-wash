import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CarFront, CircleHelp, MapPinned, Sparkles } from "lucide-react";

const guides = [
  {
    icon: CarFront,
    number: "01",
    title: "Choose a wash for the vehicle you have",
    text: "Start with the vehicle category in your account. Wash options and prices can vary by vehicle, so review the available package details before you book.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Pick a one-time wash or a monthly plan",
    text: "Book a one-time exterior wash when you need it, or check whether a monthly wash plan is available for your vehicle. Plan allowances and billing details appear with the package.",
  },
  {
    icon: CalendarClock,
    number: "03",
    title: "Choose a time that works for you",
    text: "Set the service location and choose from the appointment times shown during booking. The local supervisor reviews washer availability and makes the assignment.",
  },
];

const faqs = [
  {
    question: "How do I book a doorstep car wash?",
    answer: "Create or sign in to a customer account, choose the service location, select a saved vehicle, review the available wash packages, and pick an appointment time. You can follow booking updates in your account.",
  },
  {
    question: "Can I see the price before I book?",
    answer: "Yes. Available packages show their price and service details before you continue to scheduling. The options shown depend on the selected vehicle and the packages currently configured for your service area.",
  },
  {
    question: "Are monthly car wash plans available for every vehicle?",
    answer: "Monthly plans are shown when they have been configured for your vehicle category. If a plan is not listed, check the one-time wash options or contact support from your account.",
  },
  {
    question: "How will I know who is coming to wash my car?",
    answer: "After you place a booking, a local supervisor reviews availability and assigns an eligible washer. Assignment and service progress updates are available from your booking account.",
  },
  {
    question: "Where can I book a WashNow service?",
    answer: "Coverage and appointment availability depend on your service location. Enter your address in the booking flow to see the options currently available there.",
  },
];

export default function ServiceGuide() {
  return <section className="bg-white py-16 sm:py-20" aria-labelledby="service-guide-title">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">A smarter wash day</p>
          <h2 id="service-guide-title" className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A doorstep car wash, planned around your day.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">Get the practical details before you book. WashNow brings vehicle selection, service options, scheduling, and booking updates into one place.</p>
          <Link to="/register?role=customer" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-green-900 px-5 py-3 text-sm font-semibold text-white hover:bg-green-950">Explore available washes <ArrowRight size={16}/></Link>
          <div className="mt-8 flex items-start gap-3 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-600"><MapPinned size={19} className="mt-0.5 shrink-0 text-green-800"/><p>Service options and appointment availability are based on the address you enter during booking.</p></div>
        </div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {guides.map(({ icon: Icon, number, title, text }) => <article key={number} className="grid gap-4 py-6 sm:grid-cols-[2.5rem_1fr]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-800"><Icon size={18}/></span>
            <div><p className="text-xs font-bold uppercase tracking-wide text-green-800">Step {number}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
          </article>)}
        </div>
      </div>
      <div className="mt-16 grid gap-10 border-t border-slate-200 pt-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">Good to know</p><h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Doorstep car wash questions, answered.</h2><p className="mt-4 text-sm leading-6 text-slate-600">A little clarity makes it easier to choose a wash and plan your appointment.</p><p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700"><CircleHelp size={17} className="text-green-800"/>More help is available from your customer account.</p></div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map(({ question, answer }) => <details key={question} className="group py-4">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-bold text-slate-950 marker:hidden">{question}<span aria-hidden="true" className="text-lg font-normal text-green-800 transition-transform group-open:rotate-45">+</span></summary>
            <p className="max-w-3xl pb-2 pr-8 text-sm leading-6 text-slate-600">{answer}</p>
          </details>)}
        </div>
      </div>
    </div>
  </section>;
}
