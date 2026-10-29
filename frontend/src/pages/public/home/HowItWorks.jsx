const steps = [
  { title: "Choose your location", description: "Set the place where the washer should meet you." },
  { title: "Select a vehicle", description: "Choose a saved vehicle for this wash." },
  { title: "Pick a wash", description: "Review the available service and its price." },
  { title: "Choose a time", description: "Select an appointment and follow assignment updates." },
];

export default function HowItWorks() {
  return <section id="how-it-works" className="scroll-mt-24 bg-[#f8faf9] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-800">Customer guide</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">From address to appointment.</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">Set up your booking in a few clear steps. Your account keeps the details together.</p>
      </div>
      <ol className="mt-10 divide-y divide-slate-300 border-y border-slate-300 lg:grid lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {steps.map((step, index) => <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 py-5 lg:block lg:px-5 lg:py-6 first:lg:pl-0 last:lg:pr-0">
          <span className="text-sm font-bold tabular-nums text-green-800">0{index + 1}</span>
          <div><h3 className="text-base font-bold text-slate-950">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}
