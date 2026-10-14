import { Car, MapPin } from "lucide-react";

function WasherArrivalBookingDetails({ booking }) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Car /></div>
        <p className="mt-4 text-xs font-bold uppercase text-slate-400">Vehicle</p>
        <h3 className="mt-2 font-bold">{booking.vehicle?.name || "Vehicle"}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {booking.vehicle
            ? `${booking.vehicle.type} • ${booking.vehicle.colour} • ${booking.vehicle.number}`
            : ""}
        </p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin /></div>
        <p className="mt-4 text-xs font-bold uppercase text-slate-400">Location</p>
        <h3 className="mt-2 font-bold">{booking.location?.name || "Service Location"}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {booking.address?.tower || ""}
          {booking.address?.flatNumber && ` • Flat ${booking.address.flatNumber}`}
        </p>
      </div>
    </div>
  );
}

export default WasherArrivalBookingDetails;
