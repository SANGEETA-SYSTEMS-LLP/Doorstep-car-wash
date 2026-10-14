import { Car, CheckCircle2, Clock3, MapPin } from "lucide-react";

const benefits = [
  {
    icon: MapPin,
    title: "We come to you",
    description: "Book a wash at home, at work, or anywhere in our service area.",
  },
  {
    icon: CheckCircle2,
    title: "Care you can trust",
    description: "Our washer partners follow a clear service checklist for every vehicle.",
  },
  {
    icon: Clock3,
    title: "Fits your schedule",
    description: "Choose a date and time that works for you, then follow the booking updates.",
  },
];

function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Car size={28} />
          </div>
          <p className="mt-5 font-semibold text-blue-600">ABOUT WASHNOW</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            A cleaner car, without the trip to a wash
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            WashNow makes car care simple. Book a doorstep wash, choose the
            service and time you prefer, and a washer partner will come to your
            location. Follow your booking as the service progresses and get
            back to your day while your car gets the care it needs.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
