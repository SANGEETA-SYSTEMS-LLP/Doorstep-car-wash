import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import usePaymentWorkflow from "./usePaymentWorkflow";
import PaymentMethodsPanel from "./PaymentMethodsPanel";
import PaymentSummary from "./PaymentSummary";

function Payment() {
  const navigate = useNavigate();
  const {
    booking,
    paymentError,
    paymentMethod,
    upiId,
    setUpiId,
    processing,
    handlePayment,
    handlePaymentMethodChange,
  } = usePaymentWorkflow();
  const servicePrice = booking.package?.price || 0;
  const platformFee = 20;
  const discount = 20;
  const total = servicePrice > 0 ? servicePrice + platformFee - discount : 0;

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
          <ArrowLeft size={17} /> Back to booking review
        </button>
        <div className="mt-8 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          <PaymentMethodsPanel
            paymentMethod={paymentMethod}
            onMethodChange={handlePaymentMethodChange}
            upiId={upiId}
            setUpiId={setUpiId}
          />
          <PaymentSummary
            booking={booking}
            servicePrice={servicePrice}
            platformFee={platformFee}
            discount={discount}
            total={total}
            paymentMethod={paymentMethod}
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
