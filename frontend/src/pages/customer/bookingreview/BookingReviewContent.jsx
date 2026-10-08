import { ArrowRight, CalendarDays, Car, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import ReviewCard from "./ReviewCard";
import Price from "./Price";

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

          <div>
            <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">
                Price Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <Price
                  label={booking.package?.name || "Service"}
                  amount={`₹${servicePrice}`}
                />

                <Price
                  label="Platform fee"
                  amount={`₹${platformFee}`}
                />

                <Price
                  label="Discount"
                  amount={`-₹${discount}`}
                  green
                />
              </div>

              <div className="my-5 border-t border-dashed border-slate-200" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">
                    Total Amount
                  </p>

                  <p className="text-xs text-slate-400">
                    Inclusive of applicable taxes
                  </p>
                </div>

                <p className="text-2xl font-bold">
                  ₹{total}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/customer/payment")
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white"
              >
                Continue to Payment
                <ArrowRight size={18} />
              </button>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-green-50 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <p className="text-xs leading-5 text-green-700">
                  Your booking and payment information will be
                  securely processed.
                </p>
              </div>
            </div>
          </div>
        </div>
  );
}

export default BookingReviewContent;
