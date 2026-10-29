import { Car, Droplets, ReceiptText } from "lucide-react";
import SummaryCard from "./SummaryCard";

function ServiceSummary({ vehicle, packageName, price }) {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      <SummaryCard icon={<Car />} label="Vehicle" value={vehicle || "Vehicle"} />
      <SummaryCard icon={<Droplets />} label="Service" value={packageName || "Car Wash"} />
      <SummaryCard icon={<ReceiptText />} label="Amount" value={`₹${price}`} />
    </div>
  );
}

export default ServiceSummary;
