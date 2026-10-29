import { Car, MapPin, CalendarDays } from "lucide-react";
import Process from "./Process";
import { WashNowBrand } from "../../../components/layout/WashNowBrand";

const content = {
  customer: {
    title: "Professional car care at your doorstep.",
    description: "Create your account, add your vehicle and book your first doorstep wash in minutes.",
    label: "BOOKING PROCESS",
    steps: ["Choose your location", "Add your vehicle", "Select a wash package", "Choose date and time", "Track your washer"],
  },
  supervisor: {
    title: "Help every service run smoothly.",
    description: "Register as a supervisor to coordinate jobs, support washers and resolve customer issues after your account is activated.",
    label: "SUPERVISOR REGISTRATION",
    steps: ["Enter your details", "Verify your email if prompted", "Contact your administrator for activation", "Start managing operations"],
  },
  washer: {
    title: "Bring great car care to every doorstep.",
    description: "Register as a washer to receive assigned jobs, follow service details and track your work after your account is activated.",
    label: "WASHER REGISTRATION",
    steps: ["Enter your details", "Verify your email if prompted", "Contact your administrator for activation", "Start receiving wash jobs"],
  },
};

function RegistrationBrandPanel({ accountType = "customer" }) {
  const copy = content[accountType] || content.customer;
  if (accountType === "customer") return <section className="hidden bg-green-950 text-white lg:block">
    <div className="sticky top-0 flex min-h-screen flex-col justify-between gap-12 p-10 xl:p-14">
      <WashNowBrand light />
      <div>
        <p className="border-y border-white/20 py-2 text-xs font-semibold text-green-100">Washer and customer workspaces</p>
        <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">A cleaner car.<br/><span className="text-green-300">A simpler day.</span></h1>
        <p className="mt-5 max-w-sm text-base leading-7 text-slate-300">Book your next car wash from home. Choose a service and a time that works for you.</p>
        <div className="mt-10 space-y-6">
          {[[MapPin,'At your doorstep','Save your address for an easier booking.'],[CalendarDays,'On your schedule','Choose your preferred date and time.'],[Car,'Stay in the loop','See your assigned washer and booking updates.']].map(([Icon,title,description]) => <div key={title} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-green-200"><Icon size={19}/></span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 max-w-xs text-sm leading-6 text-slate-400">{description}</p></div></div>)}
        </div>
      </div>
      <p className="border-t border-white/10 pt-6 text-xs text-slate-400">Your car care, all in one place.</p>
    </div>
  </section>;
  return (
    <section className="hidden min-h-screen bg-green-950 text-white lg:block">
      <div className="sticky top-0 flex min-h-screen flex-col justify-between gap-10 p-10 xl:p-14">
      <WashNowBrand light />
      <div className="my-auto w-full max-w-xl py-10">
        <p className="font-semibold tracking-[0.14em] text-green-300">GET STARTED</p>
        <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-green-100 xl:text-lg xl:leading-8">
          {copy.description}
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 xl:mt-9 xl:p-6">
          <p className="text-xs font-semibold tracking-[0.12em] text-green-200">{copy.label}</p>
          <div className="mt-5 space-y-4">
            {copy.steps.map((text, index) => <Process key={text} number={String(index + 1).padStart(2, "0")} text={text} />)}
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 pt-5 text-xs text-green-200/80">Your car care, all in one place.</p>
      </div>
    </section>
  );
}

export default RegistrationBrandPanel;
