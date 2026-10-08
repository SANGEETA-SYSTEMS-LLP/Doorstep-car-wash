import { LockKeyhole, ShieldCheck } from "lucide-react";

function OtpVerification({ otp, setOtp, verifyOtp }) {
  return (
    <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <LockKeyhole size={30} />
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Verify Customer OTP
            </h2>

            <p className="mt-2 leading-6 text-slate-500">
              Ask the customer for the 4-digit service
              verification OTP before starting the wash.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="••••"
              className="mx-auto mt-7 block w-48 rounded-2xl border border-slate-300 px-5 py-4 text-center text-3xl font-bold tracking-[0.4em] outline-none focus:border-blue-500"
            />

            <p className="mt-3 text-xs text-slate-400">
              Demo OTP: 4826
            </p>

            <button
              disabled={otp.length !== 4}
              onClick={verifyOtp}
              className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:opacity-40"
            >
              Verify OTP
            </button>

            <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-left">
              <ShieldCheck
                size={20}
                className="shrink-0 text-amber-600"
              />

              <p className="text-xs leading-5 text-amber-700">
                Never start the service without OTP
                verification.
              </p>
            </div>
          </section>
  );
}

export default OtpVerification;
