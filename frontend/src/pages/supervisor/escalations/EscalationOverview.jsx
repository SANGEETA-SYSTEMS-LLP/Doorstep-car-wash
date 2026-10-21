import { Clock, MapPin } from "lucide-react";

function EscalationOverview({ booking, address }) {
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
      <h2 className="font-semibold text-gray-900">Booking overview</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <Detail label="Booking status" value={booking.status?.replaceAll("_", " ")} />
        <Detail label="Supervisor required" value={booking.requires_supervisor ? "Yes" : "No"} />
        <Detail label="Customer ID" value={booking.customer_id} />
        <Detail label="Assigned washer" value={booking.assigned_washer_id || "Not assigned"} />
        <Detail label="Scheduled date" value={booking.scheduled_date} icon={<Clock size={17} />} />
        <Detail label="Scheduled time" value={booking.scheduled_start_time} icon={<Clock size={17} />} />
        <div className="sm:col-span-2">
          <Detail label="Service address" value={formattedAddress} icon={<MapPin size={17} />} />
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 break-words font-medium capitalize text-gray-900">{value || "Not available"}</p>
      </div>
    </div>
  );
}

export default EscalationOverview;
