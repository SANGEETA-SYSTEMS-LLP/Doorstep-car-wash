import { useEffect, useRef } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import usePaymentWorkflow from "./usePaymentWorkflow";
import PaymentSummary from "./PaymentSummary";
import { getCheckoutPriceBreakdown } from "../../../services/checkoutPricing";

function Payment() {
  const navigate = useNavigate();
  const {
    booking,
    paymentError,
    processing,
    handlePayment,
  } = usePaymentWorkflow();
  const checkoutStarted = useRef(false);
  const servicePrice = booking.package?.price || 0;
  const offerDiscount = Number(booking.appliedOffer?.discountAmount || 0);
  const { platformFee, discountAmount: discount, automaticDiscountAmount, offerDiscountAmount, taxAmount, totalAmount: total } = getCheckoutPriceBreakdown(servicePrice, offerDiscount);

  useEffect(() => {
    if (checkoutStarted.current) return;
    checkoutStarted.current = true;
    void handlePayment();
  }, [handlePayment]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">SECURE CHECKOUT</p>
            <h1 className="text-xl font-bold text-slate-900">Complete Payment</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <LockKeyhole size={17} /> Secure Payment
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <button
          onClick={() => navigate("/customer/booking-review")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Back to booking review
        </button>
        <div className="mt-8 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Secure Razorpay checkout</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Opening Razorpay to complete your payment. Choose an available payment method securely in the gateway.
            </p>
            <p role="status" className="mt-5 text-sm font-medium text-blue-700">
              {processing ? "Connecting to Razorpay…" : paymentError ? "Checkout needs your attention." : "Razorpay checkout is ready."}
            </p>
          </section>
          <PaymentSummary
            booking={booking}
            servicePrice={servicePrice}
            platformFee={platformFee}
            discount={discount}
            automaticDiscountAmount={automaticDiscountAmount}
            offerDiscountAmount={offerDiscountAmount}
            offerDiscount={offerDiscount}
            appliedOffer={booking.appliedOffer}
            total={total}
            taxAmount={taxAmount}
            processing={processing}
            paymentError={paymentError}
            handlePayment={handlePayment}
          />
        </div>
      </main>
    </div>
  );
}

export default Payment;
