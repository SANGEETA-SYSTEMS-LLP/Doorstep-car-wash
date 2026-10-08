import { LockKeyhole, ShieldCheck } from "lucide-react";
import SummaryRow from "./SummaryRow";

function PaymentSummary({ booking, servicePrice, platformFee, discount, total, paymentMethod, processing, handlePayment }) {
  return (
    <aside>
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Booking Summary
              </h2>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Service
                </p>

                <h3 className="mt-2 font-bold">
                  {booking.package?.name || "Car Wash"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {booking.vehicle
                    ? `${booking.vehicle.name} • ${booking.vehicle.type}`
                    : "Vehicle"}
                </p>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <SummaryRow
                  label="Service amount"
                  value={`₹${servicePrice}`}
                />

                <SummaryRow
                  label="Platform fee"
                  value={`₹${platformFee}`}
                />

                <SummaryRow
                  label="Discount"
                  value={`-₹${discount}`}
                  green
                />
              </div>

              <div className="my-5 border-t border-dashed border-slate-200" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="font-bold">
                    Total
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Inclusive of taxes
                  </p>
                </div>

                <p className="text-3xl font-bold">
                  ₹{total}
                </p>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing...
                  </>
                ) : paymentMethod === "cod" ? (
                  "Confirm Booking"
                ) : (
                  `Pay ₹${total}`
                )}
              </button>

              <div className="mt-5 flex gap-3 rounded-xl bg-green-50 p-4">
                <ShieldCheck
                  size={20}
                  className="shrink-0 text-green-600"
                />

                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Secure checkout
                  </p>

                  <p className="mt-1 text-xs leading-5 text-green-700">
                    Payment details are protected and securely
                    processed.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <LockKeyhole size={13} />
                Secure payment • Protected checkout
              </div>
            </div>
          </aside>
  );
}

export default PaymentSummary;
