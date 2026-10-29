import { CheckCircle2 } from "lucide-react";

function CompletedService({ jobStatus, validating, onValidate, onDashboard }) {
  const completed = jobStatus === "completed";
  return (
    <section className="mx-auto mt-10 max-w-xl rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 size={42} />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-wider text-green-600">
        {completed ? "Job Completed" : "Photos Submitted"}
      </p>
      <h2 className="mt-2 text-3xl font-bold">{completed ? "Great work!" : "Service photos are ready"}</h2>
      <p className="mt-3 leading-7 text-slate-500">
        {completed
          ? "The booking is complete and visible to the customer and supervisor."
          : "Either you or a supervisor can validate the photos to complete this booking."}
      </p>
      <div className="mt-7 rounded-2xl bg-green-50 p-5">
        <p className="text-sm text-green-700">
          {completed
            ? "Earnings are calculated by the backend after payment confirmation."
            : "The booking remains active until validation is complete."}
        </p>
      </div>
      {completed ? (
        <button onClick={onDashboard} className="mt-7 w-full rounded-xl bg-green-600 py-4 font-semibold text-white">
          Back to Dashboard
        </button>
      ) : (
        <button
          type="button"
          onClick={onValidate}
          disabled={validating}
          className="mt-7 w-full rounded-xl bg-green-600 py-4 font-semibold text-white disabled:opacity-50"
        >
          {validating ? "Validating..." : "Validate and complete job"}
        </button>
      )}
    </section>
  );
}

export default CompletedService;
