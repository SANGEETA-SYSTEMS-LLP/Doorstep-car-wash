import { CalendarDays, Car, MapPin, ShieldCheck } from "lucide-react";

const steps = [
  { icon: MapPin, number: "01", title: "Choose Location", description: "Set your home, office or society location." },
  { icon: Car, number: "02", title: "Select Vehicle", description: "Choose the vehicle that needs cleaning." },
  { icon: ShieldCheck, number: "03", title: "Choose Package", description: "Pick the wash package that suits you." },
  { icon: CalendarDays, number: "04", title: "Schedule Wash", description: "Choose a convenient date and time." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Simple from the start</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">A better wash in four easy steps</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">Set up your booking in minutes. We’ll keep you updated along the way.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, ...step }) => (
            <article key={step.number} className="group rounded-2xl border border-slate-200/90 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 transition group-hover:bg-blue-800 group-hover:text-white">
                  <Icon size={21} />
                </div>
                <span className="text-xs font-bold tracking-[0.12em] text-slate-300">{step.number}</span>
              </div>
              <h3 className="mt-6 text-base font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
