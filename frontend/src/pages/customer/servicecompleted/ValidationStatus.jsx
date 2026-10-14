import { ShieldCheck } from "lucide-react";

function ValidationStatus({ completed }) {
  return (
    <div className="mt-6 flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-5">
      <ShieldCheck className="shrink-0 text-green-600" />
      <div>
        <p className="font-semibold text-green-800">
          {completed ? "Validation complete" : "Waiting for validation"}
        </p>
        <p className="mt-1 text-sm leading-6 text-green-700">
          {completed
            ? "The booking status has been updated for you, the washer, and the supervisor."
            : "The booking will be marked complete once the washer or supervisor validates the submitted photos."}
        </p>
      </div>
    </div>
  );
}

export default ValidationStatus;
