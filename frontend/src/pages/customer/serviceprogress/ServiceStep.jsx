import { CheckCircle2, Droplets } from "lucide-react";

function ServiceStep({
  title,
  description,
  completed,
  active,
  last,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            completed
              ? "bg-green-600 text-white"
              : active
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {completed ? (
            <CheckCircle2 size={18} />
          ) : active ? (
            <Droplets size={17} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current" />
          )}
        </div>

        {!last && (
          <div
            className={`h-16 w-[2px] ${
              completed ? "bg-green-200" : "bg-slate-200"
            }`}
          />
        )}
      </div>

      <div>
        <p
          className={`font-semibold ${
            active
              ? "text-blue-700"
              : completed
              ? "text-slate-800"
              : "text-slate-400"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default ServiceStep;
