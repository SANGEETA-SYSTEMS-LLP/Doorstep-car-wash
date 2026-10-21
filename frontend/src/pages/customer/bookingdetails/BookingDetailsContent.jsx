import { ArrowLeft, CalendarDays, Car, Clock3, MapPin, Phone, Star, UserRound } from "lucide-react";
import Card from "./Card";
import Info from "./Info";
import Price from "./Price";
import { Link } from "react-router-dom";

function BookingDetailsContent({ navigate, booking }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-blue-600">
              {booking.booking_number}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Booking Details
            </h1>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            {formatStatus(booking.status)}
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <Card title="Service Information">
              <h2 className="text-xl font-bold">
                {booking.package?.name || "Car Wash"}
              </h2>

              <div className="flex gap-3">
                <Car className="shrink-0 text-blue-600" />
                <div>
                  <p className="font-bold">
                    {booking.vehicle
                      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                      : "Vehicle"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.vehicle?.vehicle_type}
                    {booking.vehicle?.colour && ` • ${booking.vehicle.colour}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {booking.vehicle?.vehicle_number}
                  </p>
                </div>
              </div>

              <p className="font-bold">
                ₹{Number(booking.service_amount).toLocaleString("en-IN")}
              </p>

              <Info
                icon={<CalendarDays />}
                label="Date"
                value={booking.scheduled_date}
              />

              <Info
                icon={<Clock3 />}
                label="Time"
                value={booking.scheduled_time}
              />
            </Card>

            <Card title="Service Location">
              <div className="flex gap-3">
                <MapPin className="shrink-0 text-blue-600" />

                <div>
                  <p className="font-bold">
                    {booking.service_address}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {booking.tower || ""}
                    {booking.flat_number && ` • Flat ${booking.flat_number}`}
                  </p>

                  {booking.landmark && (
                    <p className="mt-1 text-sm text-slate-500">
                      Landmark: {booking.landmark}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Your Washer">
              {booking.washer ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <UserRound size={26} />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-lg font-bold text-slate-900">
                        {booking.washer.name}
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-blue-700">{booking.washer.phone || "Contact number unavailable"}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        Assigned washer
                        {booking.washer.referenceId
                          ? ` · ${booking.washer.referenceId}`
                          : ""}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <Star size={15} className="fill-amber-400 text-amber-400" />
                        {Number(booking.washer.rating || 0).toFixed(1)}
                        <span className="text-slate-400">
                          · {booking.washer.totalJobs || 0} completed jobs
                        </span>
                      </p>
                    </div>
                  </div>
                  {booking.washer.phone && (
                    <a
                      href={`tel:${String(booking.washer.phone).replace(/[^+0-9]/g, "")}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      <Phone size={16} />
                      Call washer
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  A washer has not accepted this booking yet. Their name and contact details will appear here after they accept it.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Booking Status">
              <p className="font-bold">{formatStatus(booking.status)}</p>
            </Card>

            <Card title="Payment Summary">
              <Price label="Service Amount" value={`₹${Number(booking.service_amount).toLocaleString("en-IN")}`} />
              <Price label="Platform Fee" value={`₹${Number(booking.platform_fee).toLocaleString("en-IN")}`} />
              <Price label="Discount" value={`-₹${Number(booking.discount_amount).toLocaleString("en-IN")}`} />

              <div className="my-4 border-t border-dashed" />

              <Price label="Total Amount" value={`₹${Number(booking.total_amount).toLocaleString("en-IN")}`} bold />
            </Card>

            {booking.washer && ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(booking.status) && <Link to="/customer/track-booking" className="flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800">Track your washer</Link>}
            {booking.washer && ["service_completed", "customer_confirmed", "payment_completed", "closed", "completed"].includes(booking.status) && <Link to="/customer/service-completed" className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">View before and after photos</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatus(status) {
  if (!status) return "";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default BookingDetailsContent;
