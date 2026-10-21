import Navbar, { WashNowMark } from "../../../components/layout/Navbar";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import HomeHero from "./HomeHero";
import HowItWorks from "./HowItWorks";
import About from "./About";
import WasherPartnerCta from "./WasherPartnerCta";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HomeHero />
        <HowItWorks />
        <About />
        <WasherPartnerCta />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3"><WashNowMark /><span><span className="block text-sm font-bold tracking-tight text-slate-950">WashNow</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Care that comes to you</span></span></Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><a href="#how-it-works" className="hover:text-blue-800">Customer guide</a><a href="#washer-partners" className="hover:text-blue-800">Washer partners</a><Link to="/login" className="inline-flex items-center gap-1 hover:text-blue-800">Sign in <ArrowUpRight size={13} /></Link></div>
          <span className="text-xs text-slate-400">A better wash day, for everyone.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
