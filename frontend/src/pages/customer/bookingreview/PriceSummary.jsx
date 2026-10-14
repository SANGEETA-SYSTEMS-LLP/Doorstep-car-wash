import { ArrowRight, ShieldCheck } from "lucide-react";
import Price from "./Price";

function PriceSummary({ booking, servicePrice, platformFee, discount, total, navigate }) {
  return (
    <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Price Summary</h2>
      <div className="mt-6 space-y-4 text-sm">
        <Price label={booking.package?.name || "Service"} amount={`₹${servicePrice}`} />
        <Price label="Platform fee" amount={`₹${platformFee}`} />
        <Price label="Discount" amount={`-₹${discount}`} green />
      </div>
      <div className="my-5 border-t border-dashed border-slate-200" />
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">Total Amount</p>
          <p className="text-xs text-slate-400">Inclusive of applicable taxes</p>
        </div>
        <p className="text-2xl font-bold">₹{total}</p>
      </div>
      <button
        onClick={() => navigate("/customer/payment")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white"
      >
        Continue to Payment
        <ArrowRight size={18} />
      </button>
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
