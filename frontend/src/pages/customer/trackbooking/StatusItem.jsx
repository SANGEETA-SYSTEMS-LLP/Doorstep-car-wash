import { Check, Navigation } from "lucide-react";

function StatusItem({
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
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            completed
              ? "bg-green-600 text-white"
              : active
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {completed ? (
            <Check size={16} />
          ) : active ? (
            <Navigation size={15} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-current" />
          )}
        </div>

        {!last && (
          <div
            className={`h-14 w-[2px] ${
              completed ? "bg-green-200" : "bg-slate-200"
            }`}
          />
        )}
      </div>

      <div className="pb-5">
        <p
          className={`text-sm font-semibold ${
            active
              ? "text-blue-700"
              : completed
              ? "text-slate-800"
              : "text-slate-400"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

export default StatusItem;
