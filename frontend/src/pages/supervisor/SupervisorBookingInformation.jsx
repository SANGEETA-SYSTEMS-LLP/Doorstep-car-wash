import { Car, CheckCircle, Clock, MapPin, User } from "lucide-react";
import InfoRow from "./SupervisorInfoRow";

function SupervisorBookingInformation({ job, address }) {
  const formattedAddress = address
    ? [
        address.address_line,
        address.tower,
        address.flat_number,
        address.landmark,
        address.city,
        address.state,
        address.postal_code,
      ].filter(Boolean).join(", ")
    : "Address unavailable";
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-gray-900">Booking information</h2>
      <div className="space-y-4 text-sm">
        <InfoRow icon={<User size={18} />} label="Customer ID" value={job.customer_id} />
        <InfoRow icon={<Car size={18} />} label="Vehicle ID" value={job.vehicle_id} />
        <InfoRow icon={<Clock size={18} />} label="Scheduled date" value={job.scheduled_date} />
        <InfoRow icon={<Clock size={18} />} label="Scheduled time" value={job.scheduled_start_time} />
        <InfoRow icon={<MapPin size={18} />} label="Address" value={formattedAddress} />
        <InfoRow icon={<CheckCircle size={18} />} label="Total amount" value={job.total_amount != null ? `₹${job.total_amount}` : "Not available"} />
      </div>
    </section>
  );
}

export default SupervisorBookingInformation;
