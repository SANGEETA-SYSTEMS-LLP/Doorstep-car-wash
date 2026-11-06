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
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <WashNowBrand subtitle="Care that comes to you" markClassName="h-10 w-10" />
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-700"><a href="#how-it-works" className="min-h-11 py-2 hover:text-green-900">Customer guide</a><a href="#washer-partners" className="min-h-11 py-2 hover:text-green-900">Washer partners</a><Link to="/terms" className="min-h-11 py-2 hover:text-green-900">Terms</Link><Link to="/privacy" className="min-h-11 py-2 hover:text-green-900">Privacy</Link><Link to="/login" className="inline-flex min-h-11 items-center gap-1 py-2 hover:text-green-900">Sign in <ArrowUpRight size={15} /></Link></div>
          <span className="text-sm text-slate-500">A better wash day, for everyone.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
