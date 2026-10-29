import { Link } from "react-router-dom";

function About() {
  return <section id="about" className="scroll-mt-24 bg-[#f4f6f5] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">One local service flow</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">One booking, clear steps for everyone.</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">Customers book and follow service updates. Supervisors review local availability and assign a washer. Washer partners manage accepted jobs in their workspace.</p>
        </div>
        <div className="divide-y divide-slate-300 border-y border-slate-300">
          <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <p className="text-xs font-bold uppercase tracking-wide text-green-800">For customers</p>
            <div><h3 className="text-lg font-bold text-slate-950">Book around your schedule</h3><p className="mt-2 text-sm leading-6 text-slate-600">Save service locations and vehicles, choose a wash, then select an appointment time. Booking and service updates stay in your account.</p><Link to="/register?role=customer" className="mt-3 inline-block text-sm font-semibold text-green-900 underline">Create a customer account</Link></div>
          </article>
          <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <p className="text-xs font-bold uppercase tracking-wide text-green-800">For washer partners</p>
            <div><h3 className="text-lg font-bold text-slate-950">Manage assigned work</h3><p className="mt-2 text-sm leading-6 text-slate-600">After verification and approval, review assigned job details, update service progress, and see completed work and earnings in the washer workspace.</p><Link to="/register?role=washer" className="mt-3 inline-block text-sm font-semibold text-green-900 underline">Apply as a washer partner</Link></div>
          </article>
          <article className="grid gap-3 py-6 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <p className="text-xs font-bold uppercase tracking-wide text-green-800">Local operations</p>
            <div><h3 className="text-lg font-bold text-slate-950">Dispatch stays supervisor-led</h3><p className="mt-2 text-sm leading-6 text-slate-600">Supervisors review eligible washers near the customer’s service location and assign the booking after checking availability.</p></div>
          </article>
        </div>
      </div>
    </div>
  </section>;
}
export default About;
