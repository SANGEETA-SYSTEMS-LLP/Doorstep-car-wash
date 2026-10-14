import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import PaymentOption from "./PaymentOption";

function PaymentMethodOptions({ paymentMethod, onChange }) {
  const options = [
    { id: "upi", icon: <Smartphone />, title: "UPI", description: "Google Pay, PhonePe, Paytm or any UPI app" },
    { id: "card", icon: <CreditCard />, title: "Credit / Debit Card", description: "Visa, Mastercard, RuPay and other cards" },
    { id: "netbanking", icon: <Landmark />, title: "Net Banking", description: "Pay securely using your bank account" },
    { id: "wallet", icon: <Wallet />, title: "Wallet", description: "Use supported digital wallets" },
    { id: "cod", icon: <Wallet />, title: "Pay After Service", description: "Pay after your car wash is completed" },
  ];
  return (
    <div className="mt-7 space-y-4">
      {options.map((option) => (
        <PaymentOption
          key={option.id}
          active={paymentMethod === option.id}
          onClick={() => onChange(option.id)}
          {...option}
        />
      ))}
    </div>
  );
}

export default PaymentMethodOptions;
