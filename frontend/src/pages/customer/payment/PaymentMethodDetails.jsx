import CardPaymentForm from "./CardPaymentForm";
import WalletButton from "./WalletButton";

function PaymentMethodDetails({ paymentMethod, upiId, setUpiId }) {
  if (paymentMethod === "card") return <CardPaymentForm />;
  if (paymentMethod === "upi") {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">Enter UPI ID</h3>
        <p className="mt-1 text-sm text-slate-500">Enter your UPI ID to continue.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
            placeholder="example@upi"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button type="button" className="rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-600">Verify</button>
        </div>
      </div>
    );
  }
  if (paymentMethod === "netbanking") {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold">Select Bank</h3>
        <select className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-blue-500">
          <option>Select your bank</option>
          <option>State Bank of India</option>
          <option>HDFC Bank</option>
          <option>ICICI Bank</option>
          <option>Axis Bank</option>
          <option>Kotak Mahindra Bank</option>
        </select>
      </div>
    );
  }
  if (paymentMethod === "wallet") {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold">Select Wallet</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <WalletButton name="Paytm" />
          <WalletButton name="PhonePe" />
          <WalletButton name="Amazon Pay" />
        </div>
      </div>
    );
  }
  if (paymentMethod === "cod") {
    return (
      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-bold text-blue-900">Pay After Service</h3>
        <p className="mt-2 text-sm leading-6 text-blue-700">
          Your booking will be confirmed now. Payment can be collected after the car wash is completed.
        </p>
      </div>
    );
  }
  return null;
}

export default PaymentMethodDetails;
