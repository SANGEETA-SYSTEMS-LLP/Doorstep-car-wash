import { Link } from "react-router-dom";
import { ArrowRight, CarFront, CheckCheck, ClipboardCheck, Droplets } from "lucide-react";

const benefits = [
  {
    icon: CarFront,
    eyebrow: "For car owners",
    title: "Keep the day moving",
    description: "Set your service location, choose a wash for your vehicle, and pick a time that works around your plans.",
    points: ["Home, office, or saved address", "Package matched to your vehicle", "Booking and service updates"],
    action: "Create a customer account",
    to: "/register?role=customer",
    tone: "blue",
  },
  {
    icon: Droplets,
    eyebrow: "For washer partners",
    title: "A clearer way to work",
    description: "Apply to join the local network, manage assigned jobs from your workspace, and keep service progress in one place.",
    points: ["Job details before you accept", "Availability and service checklist", "Earnings and payout status"],
    action: "Apply as a washer partner",
    to: "/register?role=washer",
    tone: "teal",
  },
  {
    icon: ClipboardCheck,
    eyebrow: "One shared service flow",
    title: "Clear steps on both sides",
    description: "From booking to customer confirmation, each service moves through a visible workflow for the customer and the assigned washer.",
    points: ["Arrival and service status", "Checklist and before/after photos", "Payment and completion records"],
    tone: "slate",
  },
];

const toneClasses = {
  blue: { icon: "bg-blue-50 text-blue-800", dot: "bg-blue-600", link: "text-blue-800" },
  teal: { icon: "bg-teal-50 text-teal-800", dot: "bg-teal-600", link: "text-teal-800" },
  slate: { icon: "bg-slate-100 text-slate-700", dot: "bg-slate-500", link: "text-slate-700" },
};

function About() {
  return (
    <section id="about" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">One local care network</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Made for the person booking and the person doing the work.</h2></div>
          <p className="max-w-md text-sm leading-6 text-slate-600">A practical service flow keeps the vehicle, appointment, and job progress connected from the first tap to the final confirmation.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {benefits.map(({ icon: Icon, eyebrow, title, description, points, action, to, tone }) => {
            const styles = toneClasses[tone];
            return <article key={title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/[0.02] sm:p-7">
              <div className="flex items-center justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.icon}`}><Icon size={21} /></span><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</span></div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-slate-600">{description}</p>
              <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">{points.map(point => <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600"><CheckCheck size={16} className={`mt-0.5 shrink-0 ${styles.link}`} />{point}</li>)}</ul>
              {action && <Link to={to} className={`mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold ${styles.link}`}>{action}<ArrowRight size={16} /></Link>}
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

export default About;
