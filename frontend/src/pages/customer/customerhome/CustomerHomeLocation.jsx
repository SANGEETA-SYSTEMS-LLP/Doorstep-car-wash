import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import SmallStep from "./SmallStep";

function CustomerHomeLocation() {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="mb-4 text-xl font-bold">
              Your service location
            </h2>

            <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] bg-[size:45px_45px]" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                  <MapPin size={27} />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white p-4 shadow">
                <p className="font-semibold">
                  Home
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Select your location to start booking.
                </p>
              </div>
            </div>
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
