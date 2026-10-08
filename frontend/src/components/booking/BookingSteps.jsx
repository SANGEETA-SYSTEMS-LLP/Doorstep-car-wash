import {
  MapPin,
  Car,
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const steps = [
  { id: 1, title: "Location", icon: MapPin },
  { id: 2, title: "Vehicle", icon: Car },
  { id: 3, title: "Package", icon: Sparkles },
  { id: 4, title: "Schedule", icon: CalendarDays },
  { id: 5, title: "Review", icon: CheckCircle2 },
];

function BookingSteps({ currentStep }) {
  return (
    <div className="overflow-x-auto border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-w-[650px] max-w-4xl items-center justify-between px-6 py-5">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const completed = step.id < currentStep;
          const active = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    completed
                      ? "bg-green-600 text-white"
                      : active
                      ? "bg-blue-600 text-white"
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
                  <p className="text-xs text-slate-400">
                    Step {step.id}
                  </p>

                  <p
                    className={`text-sm font-semibold ${
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
                  className={`mx-4 h-[2px] flex-1 ${
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