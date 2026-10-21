import { Car, Clock3, MapPin, Search, ShieldCheck } from "lucide-react";
import WasherFound from "./WasherFound";
import BookingDetail from "./BookingDetail";

function FindingWasherStatus({ booking, databaseBooking, navigate, washerFound }) {
  return (
    <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              {!washerFound ? (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Search
                      size={34}
                      className="animate-pulse"
                    />
                  </div>

                  <div className="mt-5 text-center">
                    <h2 className="text-2xl font-bold">
                      {databaseBooking?.status === "pending" ? "Waiting for supervisor review" : databaseBooking?.status === "confirmed" ? "Booking accepted" : databaseBooking?.status === "finding_washer"
                        ? "Finding your washer..."
                        : databaseBooking
                          ? "Booking status: " + (databaseBooking.status || "pending").split("_").join(" ")
                          : "Loading booking..."}
                    </h2>
                    {databaseBooking && !washerFound && (
                      <p className="mt-2 text-slate-500">
                        Your supervisor will check your booking details and assign an available washer. Assigned washer details will appear here.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <WasherFound
                  onTrack={() =>
                    navigate("/customer/track-booking")
                  }
                />
              )}
            </div>

            {databaseBooking && (
              <p className="mt-3 text-sm font-semibold text-blue-600">
                {databaseBooking.booking_number}
              </p>
            )}

            {/* BOOKING */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Booking Details
              </p>

              <div className="mt-5 space-y-5">
                <BookingDetail
                  icon={<Car />}
                  title={booking.package?.name || "Car Wash"}
                  text={
                    booking.vehicle
                      ? `${booking.vehicle.name} • ${booking.vehicle.type}`
                      : "Vehicle"
                  }
                />

                <BookingDetail
                  icon={<Clock3 />}
                  title={booking.schedule?.time || "Time not selected"}
                  text={
                    booking.schedule?.date
                      ? `${booking.schedule.date.date} ${booking.schedule.date.month} 2026`
                      : "Date not selected"
                  }
                />

                <BookingDetail
                  icon={<MapPin />}
                  title={booking.location?.name || "Service Location"}
                  text={`${booking.address?.tower || ""}${
                    booking.address?.flatNumber
                      ? ` • Flat ${booking.address.flatNumber}`
                      : ""
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl bg-green-50 p-5">
              <ShieldCheck
                size={21}
                className="shrink-0 text-green-600"
              />

              <div>
                <p className="text-sm font-bold text-green-800">
                  Verified professionals
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  Washers are verified before they can accept
                  customer jobs.
                </p>
              </div>
            </div>
          </aside>
  );
}

export default FindingWasherStatus;
