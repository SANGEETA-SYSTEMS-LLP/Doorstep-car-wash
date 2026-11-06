import SignupDropdown from "./SignupDropdown";
import { Link } from "react-router-dom";
import { WashNowMark } from "./WashNowBrand";

export { WashNowMark } from "./WashNowBrand";

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f8faf9]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:min-h-[4.5rem] sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-3" aria-label="WashNow home">
          <WashNowMark />

          <div>
            <p className="text-base font-bold leading-5 tracking-tight text-slate-950 sm:text-lg">
              WashNow
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-500 sm:text-[11px]">
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link to="/login" className="min-h-11 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-green-800 sm:px-3">Log in</Link>
          <SignupDropdown />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
