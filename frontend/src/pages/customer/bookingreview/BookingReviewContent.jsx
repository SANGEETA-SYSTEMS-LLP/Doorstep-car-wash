import { CalendarDays, Car, Clock3, MapPin, Sparkles } from "lucide-react";
import ReviewCard from "./ReviewCard";
import PriceSummary from "./PriceSummary";

function BookingReviewContent({ booking, servicePrice, platformFee, discount, total, navigate }) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-5">
            <ReviewCard
              icon={<MapPin />}
              title="Service Location"
            >
              <p className="font-bold">
                {booking.location?.name || "Location not selected"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {booking.address?.tower || "Tower not selected"}
                {booking.address?.flatNumber &&
                  `, Flat ${booking.address.flatNumber}`}
              </p>

              <p className="text-sm text-slate-500">
                {booking.location?.address || ""}
              </p>

              {booking.address?.landmark && (
                <p className="mt-1 text-sm text-slate-500">
                  Landmark: {booking.address.landmark}
                </p>
              )}
            </ReviewCard>

            <ReviewCard
              icon={<Car />}
              title="Vehicle"
            >
              <p className="font-bold">
                {booking.vehicle?.name || "Vehicle not selected"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {booking.vehicle
                  ? `${booking.vehicle.type} • ${booking.vehicle.colour} • ${booking.vehicle.number}`
                  : ""}
              </p>
            </ReviewCard>

            <ReviewCard
              icon={<Sparkles />}
              title="Wash Package"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">
                    {booking.package?.name || "Package not selected"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Exterior + Interior Cleaning
                  </p>
                </div>

                <p className="font-bold">
                  ₹{booking.package?.price || 0}
                </p>
              </div>
            </ReviewCard>

            <ReviewCard
              icon={<CalendarDays />}
              title="Schedule"
            >
              <div className="flex flex-wrap gap-5">
                <p className="flex items-center gap-2 font-semibold">
                  <CalendarDays
                    size={17}
                    className="text-slate-400"
                  />
                  {booking.schedule?.date
                    ? `${booking.schedule.date.date} ${booking.schedule.date.month} 2026`
                    : "Date not selected"}
                </p>

                <p className="flex items-center gap-2 font-semibold">
                  <Clock3
                    size={17}
                    className="text-slate-400"
                  />
                  {booking.schedule?.time || "Time not selected"}
                </p>
              </div>
            </ReviewCard>
          </div>

          {/* PAYMENT SUMMARY */}

          <PriceSummary
            booking={booking}
            servicePrice={servicePrice}
            platformFee={platformFee}
            discount={discount}
            total={total}
            navigate={navigate}
          />
        </div>
  );
}

export default BookingReviewContent;
