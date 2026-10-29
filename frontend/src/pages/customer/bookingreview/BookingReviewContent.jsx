import { CalendarDays, Car, Clock3, MapPin, Droplets, Tag } from "lucide-react";
import ReviewCard from "./ReviewCard";
import PriceSummary from "./PriceSummary";

function BookingReviewContent({
  booking,
  servicePrice,
  platformFee,
  discount,
  offerDiscount,
  appliedOffer,
  offerCode,
  offerError,
  offerBusy,
  onOfferCodeChange,
  onApplyOffer,
  onRemoveOffer,
  total,
  taxAmount,
  paymentError,
  processing,
  onContinue,
  navigate,
}) {
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
              icon={<Droplets />}
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

            <ReviewCard icon={<Tag />} title="Offer code">
              {appliedOffer ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-emerald-700"><span className="font-semibold">{appliedOffer.code}</span> applied · save ₹{offerDiscount}</p>
                  <button type="button" onClick={onRemoveOffer} className="text-sm font-semibold text-slate-600 underline">Remove</button>
                </div>
              ) : (
                <form onSubmit={onApplyOffer} className="flex flex-col gap-3 sm:flex-row">
                  <input value={offerCode} onChange={(event) => onOfferCodeChange(event.target.value.toUpperCase())} aria-label="Offer code" placeholder="Enter offer code" maxLength={40} className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" />
                  <button type="submit" disabled={offerBusy || !offerCode.trim()} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 disabled:opacity-50">{offerBusy ? "Checking…" : "Apply offer"}</button>
                </form>
              )}
              {offerError && <p role="alert" className="mt-3 text-sm text-red-700">{offerError}</p>}
            </ReviewCard>
          </div>

          {/* PAYMENT SUMMARY */}

          <PriceSummary
            booking={booking}
            servicePrice={servicePrice}
            platformFee={platformFee}
            discount={discount}
            offerDiscount={offerDiscount}
            appliedOffer={appliedOffer}
            total={total}
            taxAmount={taxAmount}
            paymentError={paymentError}
            processing={processing}
            onContinue={onContinue}
            navigate={navigate}
          />
        </div>
  );
}

export default BookingReviewContent;
