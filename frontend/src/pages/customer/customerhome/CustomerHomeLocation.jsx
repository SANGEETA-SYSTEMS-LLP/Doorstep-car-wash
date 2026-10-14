import ServiceMap from "../../../components/map/ServiceMap";
import { useBooking } from "../../../context/BookingContext";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SmallStep from "./SmallStep";

function CustomerHomeLocation() {
  const { booking } = useBooking();
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="mb-4 text-xl font-bold">
              Your service location
            </h2>

            <ServiceMap location={booking.location} className="h-80 rounded-2xl" />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold">
              Quick booking
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">
                Need a quick wash?
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Book in less than 2 minutes.
              </h3>

              <div className="mt-6 space-y-4">
                <SmallStep number="1" text="Choose location" />
                <SmallStep number="2" text="Select vehicle" />
                <SmallStep number="3" text="Choose package" />
                <SmallStep number="4" text="Schedule wash" />
              </div>

              <Link
                to="/customer/select-location"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white"
              >
                Start Booking
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
  );
}

export default CustomerHomeLocation;
