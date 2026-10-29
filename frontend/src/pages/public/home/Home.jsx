import Navbar from "../../../components/layout/Navbar";
import { WashNowBrand } from "../../../components/layout/WashNowBrand";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import HomeHero from "./HomeHero";
import HowItWorks from "./HowItWorks";
import About from "./About";
import WasherPartnerCta from "./WasherPartnerCta";
import ServiceGuide from "./ServiceGuide";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HomeHero />
        <HowItWorks />
        <About />
        <ServiceGuide />
        <WasherPartnerCta />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <WashNowBrand subtitle="Care that comes to you" markClassName="h-10 w-10" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><a href="#how-it-works" className="hover:text-green-900">Customer guide</a><a href="#washer-partners" className="hover:text-green-900">Washer partners</a><Link to="/terms" className="hover:text-green-900">Terms</Link><Link to="/privacy" className="hover:text-green-900">Privacy</Link><Link to="/login" className="inline-flex items-center gap-1 hover:text-green-900">Sign in <ArrowUpRight size={13} /></Link></div>
          <span className="text-xs text-slate-400">A better wash day, for everyone.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
