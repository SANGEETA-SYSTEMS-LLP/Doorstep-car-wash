import { CheckCircle2 } from "lucide-react";

function ReviewThankYou({ onContinue }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 size={42} />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Thank you!</h1>
        <p className="mt-3 leading-7 text-slate-500">
          Your feedback has been submitted successfully.
        </p>
        <button
          onClick={onContinue}
          className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ReviewThankYou;
