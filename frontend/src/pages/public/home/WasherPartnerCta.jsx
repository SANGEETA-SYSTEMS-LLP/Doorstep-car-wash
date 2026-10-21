import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, ClipboardList, Clock3, Droplets, Wallet } from "lucide-react";

const highlights = [
  { icon: ClipboardList, text: "Review eligible job details" },
  { icon: Clock3, text: "Manage your availability" },
  { icon: Wallet, text: "Track earnings and payouts" },
];

function WasherPartnerCta() {
  return (
    <section id="washer-partners" className="bg-[#f6fafc] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-11 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"><Droplets size={15} /> WashNow · partner network</span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Put your service skills on the map.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Apply to join a local doorstep car-care network. Once verified, use your washer workspace to review assignments, update service progress, and follow your earnings.</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                {highlights.map(({ icon: Icon, text }) => <span key={text} className="flex items-center gap-2 text-xs font-medium text-slate-200 sm:text-sm"><Icon size={16} className="text-cyan-300" />{text}</span>)}
              </div>
            </div>
            <div className="lg:min-w-52">
              <Link to="/register?role=washer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50">Apply as a washer partner <ArrowRight size={17} /></Link>
              <p className="mt-3 max-w-xs text-center text-xs leading-5 text-slate-400 lg:mx-auto">Every application is reviewed before job access is enabled.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
            {["Apply with your service area", "Complete supervisor review", "Go online when approved", "Track jobs and payouts"].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-200">0{index + 1}</span><span className="text-xs font-medium leading-5 text-slate-300">{step}</span></div>)}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><BadgeCheck size={15} className="text-cyan-300" /> Verified partners can control availability from the washer dashboard.</div>
        </div>
      </div>
    </section>
  );
}

export default WasherPartnerCta;
