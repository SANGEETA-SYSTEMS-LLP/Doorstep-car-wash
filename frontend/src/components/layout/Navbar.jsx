import SignupDropdown from "./SignupDropdown";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { WashNowMark } from "./WashNowBrand";

export { WashNowMark } from "./WashNowBrand";

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f8faf9]">
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
          <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-green-800">
            Our approach
          </a>

          <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-green-800">
            For customers
          </a>
          <a href="#washer-partners" className="text-sm font-medium text-slate-600 transition hover:text-green-800">For washer partners</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/register?role=washer" className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-green-800 sm:inline-flex">Partner with us <ArrowUpRight size={15} /></Link>
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-green-800">Log in</Link>
          <SignupDropdown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
