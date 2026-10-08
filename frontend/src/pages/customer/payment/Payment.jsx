import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Landmark, LockKeyhole, Smartphone, Wallet } from "lucide-react";
import { useBooking } from "../../../context/BookingContext";
import PaymentOption from "./PaymentOption";
import WalletButton from "./WalletButton";
import CardPaymentForm from "./CardPaymentForm";
import PaymentSummary from "./PaymentSummary";

function Payment() {
  const { booking, updateBooking } = useBooking();
  const servicePrice = booking.package?.price || 0;
  const platformFee = 20;
  const discount = 20;
  const total =
    servicePrice > 0
      ? servicePrice + platformFee - discount
      : 0;

  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);

    const bookingId =
      "CW-" + Date.now().toString().slice(-8);

    updateBooking({
      paymentMethod,
      bookingId,
    });

    // Temporary mock payment.
    // Later this will call Razorpay/backend API.
    setTimeout(() => {
      setProcessing(false);
      navigate("/customer/booking-success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              SECURE CHECKOUT
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Complete Payment
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <LockKeyhole size={17} />
            Secure Payment
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <button
          onClick={() => navigate("/customer/booking-review")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to booking review
        </button>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* LEFT */}

          <section>
            <div>
              <p className="font-semibold text-blue-600">
                PAYMENT
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Choose payment method
              </h2>

              <p className="mt-2 text-slate-500">
                Select how you would like to pay for your car wash.
              </p>
            </div>

            <div className="mt-7 space-y-4">
              <PaymentOption
                active={paymentMethod === "upi"}
                onClick={() => setPaymentMethod("upi")}
                icon={<Smartphone />}
                title="UPI"
                description="Google Pay, PhonePe, Paytm or any UPI app"
              />

              <PaymentOption
                active={paymentMethod === "card"}
                onClick={() => setPaymentMethod("card")}
                icon={<CreditCard />}
                title="Credit / Debit Card"
                description="Visa, Mastercard, RuPay and other cards"
              />

              <PaymentOption
                active={paymentMethod === "netbanking"}
                onClick={() => setPaymentMethod("netbanking")}
                icon={<Landmark />}
                title="Net Banking"
                description="Pay securely using your bank account"
              />

              <PaymentOption
                active={paymentMethod === "wallet"}
                onClick={() => setPaymentMethod("wallet")}
                icon={<Wallet />}
                title="Wallet"
                description="Use supported digital wallets"
              />

              <PaymentOption
                active={paymentMethod === "cod"}
                onClick={() => setPaymentMethod("cod")}
                icon={<Wallet />}
                title="Pay After Service"
                description="Pay after your car wash is completed"
              />
            </div>

            {/* UPI UI */}

            {paymentMethod === "upi" && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold text-slate-900">
                  Enter UPI ID
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enter your UPI ID to continue.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@upi"
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    className="rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-600"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* CARD UI */}

            {paymentMethod === "card" && (
              <CardPaymentForm />
            )}

            {/* NET BANKING */}

            {paymentMethod === "netbanking" && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold">
                  Select Bank
                </h3>

                <select className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-blue-500">
                  <option>Select your bank</option>
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {/* WALLET */}

            {paymentMethod === "wallet" && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold">
                  Select Wallet
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <WalletButton name="Paytm" />
                  <WalletButton name="PhonePe" />
                  <WalletButton name="Amazon Pay" />
                </div>
              </div>
            )}

            {/* PAY AFTER SERVICE */}

            {paymentMethod === "cod" && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h3 className="font-bold text-blue-900">
                  Pay After Service
                </h3>

                <p className="mt-2 text-sm leading-6 text-blue-700">
                  Your booking will be confirmed now. Payment can
                  be collected after the car wash is completed.
                </p>
              </div>
            )}
          </section>

          {/* RIGHT SUMMARY */}

          <PaymentSummary booking={booking} servicePrice={servicePrice} platformFee={platformFee} discount={discount} total={total} paymentMethod={paymentMethod} processing={processing} handlePayment={handlePayment} />
        </div>
      </main>
    </div>
  );
}

export default Payment;
