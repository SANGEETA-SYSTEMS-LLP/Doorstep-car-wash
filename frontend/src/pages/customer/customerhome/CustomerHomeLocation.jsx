import ServiceMap from "../../../components/map/ServiceMap";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import SmallStep from "./SmallStep";

function CustomerHomeLocation({ location, loading }) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <div>
        <h2 className="mb-4 text-xl font-bold">
          Saved service location
        </h2>

        {loading ? (
          <div role="status" className="h-80 animate-pulse rounded-2xl bg-white" />
        ) : location ? (
          <>
            <ServiceMap location={location} className="h-80 rounded-2xl" />
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">
                {location.label || "Saved address"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {[
                  location.address_line,
                  location.tower,
                  location.flat_number && `Flat ${location.flat_number}`,
                  location.landmark,
                  location.city,
                  location.postal_code,
                ].filter(Boolean).join(", ")}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <MapPin className="text-slate-400" size={30} />
            <h3 className="mt-3 font-bold text-slate-900">
              No saved location yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add an address during your next booking to see it here.
            </p>
            <Link
              to="/customer/select-location"
              className="mt-4 font-semibold text-green-700 hover:underline"
            >
              Add a service location
            </Link>
          </div>
        )}
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
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white"
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
