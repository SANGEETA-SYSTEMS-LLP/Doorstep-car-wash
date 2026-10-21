import { CheckCircle2 } from "lucide-react";

function ArrivalOtpPanel({ onContinue }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle2 /></div>
        <div>
          <h2 className="text-xl font-bold">Ready to begin</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your washer has arrived. Continue to view your booking while the washer prepares the service.
          </p>
        </div>
      </div>
      <button onClick={onContinue} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700">
        Continue
      </button>
    </div>
  );
}

export default ArrivalOtpPanel;
