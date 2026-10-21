import SignupDropdown from "./SignupDropdown";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export function WashNowMark() {
  return <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-lg shadow-slate-900/15">
    <svg viewBox="0 0 44 44" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M7 25.5h3.2l2.3-6.1c.4-1.1 1.4-1.8 2.6-1.8h13.5c1.1 0 2 .5 2.6 1.4l3.5 5.2 3.2 1.3v5.2H7v-5.2Z" stroke="white" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M15 18.2 17.6 14h8.8l3 4.2" stroke="#73D4C5" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14.2" cy="30.6" r="2.4" fill="#73D4C5" /><circle cx="31.7" cy="30.6" r="2.4" fill="#73D4C5" />
    </svg>
    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-cyan-300/70 blur-sm" />
  </span>;
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-3" aria-label="WashNow home">
          <WashNowMark />

          <div>
            <p className="text-lg font-bold leading-5 tracking-tight text-slate-950">
              WashNow
            </p>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-500">
              CARE THAT COMES TO YOU
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-blue-800">
            Our approach
          </a>

          <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-blue-800">
            For customers
          </a>
          <a href="#washer-partners" className="text-sm font-medium text-slate-600 transition hover:text-blue-800">For washer partners</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/register?role=washer" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-800 sm:inline-flex">Partner with us <ArrowUpRight size={15} /></Link>
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-800">Log in</Link>
          <SignupDropdown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
