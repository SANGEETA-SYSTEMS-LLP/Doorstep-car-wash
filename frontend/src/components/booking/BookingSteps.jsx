import {
  MapPin,
  Car,
  Droplets,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const steps = [
  { id: 1, title: "Location", icon: MapPin },
  { id: 2, title: "Vehicle", icon: Car },
  { id: 3, title: "Package", icon: Droplets },
  { id: 4, title: "Schedule", icon: CalendarDays },
  { id: 5, title: "Review", icon: CheckCircle2 },
];

function BookingSteps({ currentStep }) {
  return (
    <div className="overflow-hidden border-b border-slate-200 bg-white sm:overflow-x-auto">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-5 gap-1 px-2 py-3 sm:flex sm:min-w-[650px] sm:items-center sm:justify-between sm:px-6 sm:py-5">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <div key={step.id} className="flex min-w-0 flex-col items-center sm:flex-1 sm:flex-row">
              <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                    completed
                      ? "bg-green-600 text-white"
                      : active
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Icon size={19} />
                  )}
                </div>

                <div>
                  <p className="hidden text-xs text-slate-400 sm:block">
                    Step {step.id}
                  </p>

                  <p
                    className={`max-w-full text-center text-[10px] font-semibold leading-tight sm:text-left sm:text-sm ${
                      active || completed
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {index !== steps.length - 1 && (
                <div
                  className={`hidden mx-4 h-[2px] flex-1 sm:block ${
                    completed ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BookingSteps;
