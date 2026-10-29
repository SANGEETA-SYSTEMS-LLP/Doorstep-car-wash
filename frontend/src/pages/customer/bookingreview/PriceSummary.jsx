import { ArrowRight, ShieldCheck } from "lucide-react";
import Price from "./Price";
import { GST_RATE_PERCENT, formatRupees } from "../../../services/payments/checkoutPricing";

function PriceSummary({
  booking,
  servicePrice,
  platformFee,
  discount,
  offerDiscount = 0,
  appliedOffer,
  total,
  taxAmount,
  paymentError,
  processing,
  onContinue,
  navigate,
}) {
  return (
    <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Price Summary</h2>
      <div className="mt-6 space-y-4 text-sm">
        <Price label={booking.package?.name || "Service"} amount={formatRupees(servicePrice)} />
        <Price label="Platform fee" amount={formatRupees(platformFee)} />
        {discount > 0 && <Price label={appliedOffer ? `${appliedOffer.code} offer` : "Discount"} amount={`-${formatRupees(discount)}`} green />}
        <Price label={`GST (${GST_RATE_PERCENT}%)`} amount={formatRupees(taxAmount)} />
      </div>
      <div className="my-5 border-t border-dashed border-slate-200" />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">Total Amount</p>
          <p className="text-xs text-slate-400">Includes GST at {GST_RATE_PERCENT}%</p>
        </div>
        <p className="text-2xl font-bold">{formatRupees(total)}</p>
      </div>
      <button
        type="button"
        disabled={processing}
        onClick={onContinue}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Opening Razorpay…" : "Continue to Payment"}
        {!processing && <ArrowRight size={18} />}
      </button>
      {paymentError && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {paymentError}
          {paymentError.toLowerCase().includes("package") && (
            <button
              type="button"
              onClick={() => navigate("/customer/select-package")}
              className="mt-2 block font-semibold underline"
            >
              Choose a compatible package
            </button>
          )}
        </div>
      )}
      <div className="mt-5 flex items-start gap-3 rounded-xl bg-green-50 p-4">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-green-600" />
        <p className="text-xs leading-5 text-green-700">
          Your booking and payment information will be securely processed.
        </p>
      </div>
    </div>
  );
}

export default PriceSummary;
