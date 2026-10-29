import { Car, Droplets, ReceiptText } from "lucide-react";
import SummaryCard from "./SummaryCard";

function ServiceSummary({ vehicle, packageName, price, extraCharge = 0 }) {
  const hasExtraCharge = Number(extraCharge) > 0;
  return (
    <div className={`mt-10 grid gap-5 ${hasExtraCharge ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      <SummaryCard icon={<Car />} label="Vehicle" value={vehicle || "Vehicle"} />
      <SummaryCard icon={<Droplets />} label="Service" value={packageName || "Car Wash"} />
      <SummaryCard icon={<ReceiptText />} label="Amount" value={`₹${price}`} />
      {hasExtraCharge && <SummaryCard icon={<ReceiptText />} label="Approved extra charge" value={`₹${Number(extraCharge).toLocaleString("en-IN")}`} />}
    </div>
  );
}

export default ServiceSummary;
