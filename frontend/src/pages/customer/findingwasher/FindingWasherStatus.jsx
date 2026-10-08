import { Car, CheckCircle2, Clock3, MapPin, Search, ShieldCheck } from "lucide-react";
import WasherFound from "./WasherFound";
import BookingDetail from "./BookingDetail";
import { searchMessages } from "./data";

function FindingWasherStatus({ booking, navigate, searchStep, washerFound }) {
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
                    <h2 className="text-xl font-bold">
                      Finding a professional
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Please wait while we find an available washer
                      near you.
                    </p>
                  </div>

                  <div className="mt-7 space-y-3">
                    {searchMessages
                      .slice(0, 4)
                      .map((message, index) => {
                        const completed = index < searchStep;
                        const current = index === searchStep;

                        return (
                          <div
                            key={message}
                            className="flex items-center gap-3"
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                completed
                                  ? "bg-green-50 text-green-600"
                                  : current
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 size={17} />
                              ) : current ? (
                                <span className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-slate-300" />
                              )}
                            </div>

                            <span
                              className={`text-sm ${
                                completed || current
                                  ? "font-medium text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {message}
                            </span>
                          </div>
                        );
                      })}
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
