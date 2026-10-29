import { CheckCircle2 } from "lucide-react";

function ArrivalConfirmationPanel({ onContinue }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle2 /></div>
        <div>
          <h2 className="text-xl font-bold">Your washer has arrived</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your washer may call to coordinate access or confirm the vehicle location. You can continue to track your booking.
          </p>
        </div>
      </div>
      <button onClick={onContinue} className="mt-6 w-full rounded-xl bg-green-600 py-4 font-semibold text-white hover:bg-green-700">
        Continue
      </button>
    </div>
  );
}

export default ArrivalConfirmationPanel;
