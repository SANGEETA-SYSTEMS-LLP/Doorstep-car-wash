import { ShieldCheck } from "lucide-react";

function ArrivalOtpPanel({ loading, bookingId, otp, error, onContinue }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><ShieldCheck /></div>
        <div>
          <h2 className="text-xl font-bold">Service Verification</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Give this OTP only after confirming that the assigned washer has reached your location.
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-blue-50 p-6 text-center">
        <p className="text-sm font-semibold text-blue-600">Service Verification OTP</p>
        {loading ? (
          <p className="mt-4">Loading...</p>
        ) : (
          <p className="mt-3 text-4xl font-black tracking-[0.4em] text-slate-900">
            {bookingId && otp ? otp : "Unavailable"}
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-slate-500">Share this OTP only after the washer has arrived at your location.</p>
      </div>
      <button onClick={onContinue} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700">
        OTP Verified — Continue
      </button>
    </div>
  );
}

export default ArrivalOtpPanel;
