import { CheckCircle2 } from "lucide-react";

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-5 text-left transition ${
        active
          ? "border-blue-600 shadow-sm shadow-blue-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-blue-50 text-blue-600"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <div className="flex-1">
        <p className="font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
          active
            ? "border-blue-600 bg-blue-600"
            : "border-slate-300"
        }`}
      >
        {active && (
          <CheckCircle2 size={15} className="text-white" />
        )}
      </div>
    </button>
  );
}

export default PaymentOption;
