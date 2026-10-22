import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getServiceOtp } from "../../../services/booking/customerBookingService";

function ArrivalOtpPanel({ bookingId, onContinue }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!bookingId) {
      setError("Booking details are unavailable. Refresh your booking and try again.");
      setLoading(false);
      return () => { active = false; };
    }
    getServiceOtp(bookingId)
      .then((result) => { if (active) setOtp(String(result.otp || "")); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load your service OTP."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId]);

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600"><CheckCircle2 /></div>
        <div>
          <h2 className="text-xl font-bold">Ready to begin</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your washer has arrived. Share this verification code with the washer to confirm the service.
          </p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-blue-50 px-5 py-4 text-center">
        <p className="text-sm font-medium text-slate-600">Your service OTP</p>
        <p className="mt-2 text-3xl font-bold tracking-[0.35em] text-blue-800" aria-live="polite">
          {loading ? "······" : otp || "------"}
        </p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <button onClick={onContinue} className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700">
        Continue
      </button>
    </div>
  );
}

export default ArrivalOtpPanel;
