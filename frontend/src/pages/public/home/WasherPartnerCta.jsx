import { ClipboardList, Clock3, Droplets, Wallet } from "lucide-react";

const highlights = [
  { icon: ClipboardList, text: "Review eligible job details" },
  { icon: Clock3, text: "Manage your availability" },
  { icon: Wallet, text: "Track earnings and payouts" },
];

function WasherPartnerCta() {
  return (
    <section id="washer-partners" className="bg-[#f6fafc] py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-lg bg-green-950 px-5 py-7 text-white sm:px-10 sm:py-11 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-3 py-1.5 text-xs font-semibold text-white"><Droplets size={15} /> WashNow · partner network</span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Put your service skills on the map.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Apply to join a local doorstep car-care network. Once verified, use your washer workspace to review assignments, update service progress, and follow your earnings.</p>
              <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
                {highlights.map(({ icon: Icon, text }) => <span key={text} className="flex items-center gap-2 text-sm font-medium text-slate-200"><Icon size={16} className="shrink-0 text-green-300" />{text}</span>)}
              </div>
            </div>
            <div className="lg:min-w-52">
              <a href="mailto:supportsstech@gmail.com?subject=Washer%20partner%20application" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-green-50">Contact us about partnering</a>
              <p className="mt-3 max-w-xs text-center text-sm leading-5 text-slate-300 lg:mx-auto">Contact our team to ask about washer partner opportunities.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 sm:mt-8 sm:grid-cols-2 sm:gap-3 sm:pt-6 lg:grid-cols-4">
            {["Contact us about opportunities", "Share your service area", "Complete supervisor review", "Use your washer workspace when approved"].map((step, index) => <div key={step} className="flex items-center gap-3 border-t border-white/15 px-2 py-3 sm:px-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">0{index + 1}</span><span className="text-sm font-medium leading-5 text-slate-200">{step}</span></div>)}
          </div>
          <p className="mt-4 border-t border-white/15 pt-4 text-sm leading-6 text-slate-300">Verified partners can control availability from the washer dashboard.</p>
        </div>
      </div>
    </section>
  );
}

export default WasherPartnerCta;
