import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Droplets,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const assurances = ["At your home or workplace", "Choose a convenient time", "Follow each service update"];

function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-cyan-100/80 via-blue-100/50 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#dff2f6] via-[#eef7f8] to-[#dce9f4] p-5 shadow-2xl shadow-blue-950/10 sm:p-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/70" />
        <div className="absolute -right-5 -top-10 h-44 w-44 rounded-full border border-white/60" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800/70">WashNow · doorstep care</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">One local network, two ways to move</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-blue-700 shadow-sm"><Sparkles size={20} /></span>
        </div>
        <div className="relative mt-5 flex h-64 items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-white/55 to-blue-100/45 sm:h-72">
          <div className="absolute bottom-10 h-8 w-[78%] rounded-[50%] bg-blue-900/10 blur-md" />
          <svg className="relative z-10 w-[90%] drop-shadow-xl" viewBox="0 0 560 300" fill="none" role="img" aria-label="Illustration of a freshly washed car">
            <path d="M83 188c8-25 26-42 58-50l40-55c10-14 24-21 43-21h112c20 0 35 8 47 25l38 53c24 7 40 20 48 42l7 35c2 11-6 20-18 20H99c-13 0-22-10-19-23l3-26Z" fill="#1E5B77" />
            <path d="m196 132 29-40c5-7 12-11 22-11h91c10 0 18 4 24 13l29 38H196Z" fill="#C9E8F1" />
            <path d="m204 126 25-34c4-5 10-8 18-8h35v42h-78Zm88-42h46c8 0 14 4 19 10l24 32h-89V84Z" fill="#E9F7FA" />
            <path d="M83 185h432c6 10 9 21 11 34 1 12-7 18-19 18H101c-14 0-23-9-20-23l2-29Z" fill="#267594" />
            <path d="M91 184h433" stroke="#8DD6E3" strokeWidth="7" strokeLinecap="round" />
            <path d="M102 211h48m300 0h49" stroke="#D3F3F4" strokeWidth="11" strokeLinecap="round" />
            <circle cx="174" cy="237" r="38" fill="#18384B" /><circle cx="174" cy="237" r="20" fill="#D9E6EA" /><circle cx="174" cy="237" r="8" fill="#7393A1" />
            <circle cx="431" cy="237" r="38" fill="#18384B" /><circle cx="431" cy="237" r="20" fill="#D9E6EA" /><circle cx="431" cy="237" r="8" fill="#7393A1" />
            <path d="M66 107c-6-12 2-27 15-31m409-20c-2-12 7-23 19-24M126 63c-1-9 5-17 14-19" stroke="#46A7B9" strokeWidth="6" strokeLinecap="round" />
            <path d="m471 112 7 13 14 2-10 10 2 14-13-7-13 7 2-14-10-10 14-2 7-13Z" fill="#fff" fillOpacity=".9" />
          </svg>
          <span className="absolute left-5 top-6 h-2 w-2 rounded-full bg-white shadow-[0_0_14px_5px_rgba(255,255,255,.8)]" />
          <span className="absolute right-10 top-14 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_14px_5px_rgba(255,255,255,.8)]" />
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[{ icon: MapPin, title: "Your place", text: "Doorstep" }, { icon: CalendarDays, title: "Your time", text: "Flexible" }, { icon: ShieldCheck, title: "Your service", text: "Tracked" }].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-white/80 bg-white/75 px-3 py-3 backdrop-blur-sm sm:px-4">
              <Icon size={17} className="text-blue-700" />
              <p className="mt-2 text-[11px] font-medium text-slate-500">{title}</p>
              <p className="text-xs font-bold text-slate-800 sm:text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:-left-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check size={21} strokeWidth={2.5} /></span>
        <div><p className="text-xs font-bold text-slate-900">A smoother routine</p><p className="text-[11px] text-slate-500">Book in just a few steps</p></div>
      </div>
    </div>
  );
}

function HomeHero() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#f6fafc]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_20%,rgba(190,225,239,.38),transparent_35%),radial-gradient(ellipse_at_85%_5%,rgba(207,240,235,.45),transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-blue-800 shadow-sm">
              <Droplets size={15} className="text-cyan-700" /> Good care for cars. Better work for partners.
            </div>
            <h1 className="mt-7 text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.65rem]">
              Good care for your car. <span className="text-blue-700">A better way to work.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              WashNow connects people who need a reliable doorstep wash with local washer partners who want clear job details and a better-organized workday.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register?role=customer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-blue-900">
                Book your first wash <ArrowRight size={17} />
              </Link>
              <Link to="/register?role=washer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white">
                Work with WashNow <Droplets size={17} className="text-cyan-700" />
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-blue-800 underline-offset-4 hover:underline">Sign in</Link><span className="mx-2 text-slate-300">·</span>Washer access follows supervisor approval.</p>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200/80 pt-6">
              {assurances.map((item) => <span key={item} className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm"><CheckCircle2 size={16} className="shrink-0 text-emerald-700" />{item}</span>)}
            </div>
          </div>
          <div className="px-2 pb-4 pt-2 sm:px-6 lg:px-2 lg:py-4"><HeroIllustration /></div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:grid-cols-3 sm:px-8 lg:px-10">
          {[{ icon: MapPin, title: "We come to you", text: "Choose your preferred service location." }, { icon: Clock3, title: "Fits your schedule", text: "Pick a date and time that works for you." }, { icon: BadgeCheck, title: "Clear service updates", text: "Stay informed as your booking progresses." }].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-slate-200 last:sm:border-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><Icon size={19} /></span>
              <div><p className="text-sm font-semibold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default HomeHero;
