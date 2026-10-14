import { ArrowLeft, CalendarDays, Car, Clock3, MapPin } from "lucide-react";
import Card from "./Card";
import Info from "./Info";
import Price from "./Price";

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
