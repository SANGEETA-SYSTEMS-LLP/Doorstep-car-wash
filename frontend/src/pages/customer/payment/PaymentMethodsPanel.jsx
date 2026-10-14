import PaymentMethodOptions from "./PaymentMethodOptions";
import PaymentMethodDetails from "./PaymentMethodDetails";

function PaymentMethodsPanel({ paymentMethod, onMethodChange, upiId, setUpiId }) {
  return (
    <section>
      <div>
        <p className="font-semibold text-blue-600">PAYMENT</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Choose payment method</h2>
        <p className="mt-2 text-slate-500">Select how you would like to pay for your car wash.</p>
      </div>
      <PaymentMethodOptions paymentMethod={paymentMethod} onChange={onMethodChange} />
      <PaymentMethodDetails paymentMethod={paymentMethod} upiId={upiId} setUpiId={setUpiId} />
    </section>
  );
}

export default PaymentMethodsPanel;
