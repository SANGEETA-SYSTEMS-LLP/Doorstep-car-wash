import { Clock3 } from "lucide-react";

function Schedule({
  time,
  service,
  status,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
        <Clock3 size={16} />
      </div>

      <div className="flex-1">
        <div className="flex justify-between gap-3">
          <p className="text-sm font-semibold">
            {service}
          </p>

          <span
            className={`text-xs font-semibold ${
              status === "Completed"
                ? "text-green-600"
                : status === "Current"
                ? "text-green-600"
                : "text-slate-400"
            }`}
          >
            {status}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {time}
        </p>
      </div>
    </div>
  );
}

export default Schedule;
