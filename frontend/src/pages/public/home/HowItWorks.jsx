import { CalendarDays, Car, MapPin, ShieldCheck } from "lucide-react";

const steps = [
  { icon: MapPin, number: "01", title: "Choose Location", description: "Set your home, office or society location." },
  { icon: Car, number: "02", title: "Select Vehicle", description: "Choose the vehicle that needs cleaning." },
  { icon: ShieldCheck, number: "03", title: "Choose Package", description: "Pick the wash package that suits you." },
  { icon: CalendarDays, number: "04", title: "Schedule Wash", description: "Choose a convenient date and time." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="text-center">
          <p className="font-semibold text-blue-600">SIMPLE BOOKING</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Get your car cleaned in four steps</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, ...step }) => (
            <div key={step.number} className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon />
                </div>
                <span className="text-sm font-bold text-slate-300">{step.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
