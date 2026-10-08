import { Car, Clock3, MapPin, MessageCircle, Navigation, Phone, UserRound } from "lucide-react";
import Summary from "./Summary";

function WasherJobDetailsContent({ navigate, jobId }) {
  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {/* CUSTOMER */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <UserRound />
                  </div>

                  <div>
                    <p className="font-bold">
                      Gayatri Panda
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Customer
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
                    <Phone size={17} />
                  </button>

                  <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
                    <MessageCircle size={17} />
                  </button>
                </div>
              </div>
            </section>

            {/* LOCATION */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex gap-3">
                <MapPin className="shrink-0 text-blue-600" />

                <div>
                  <p className="font-bold">
                    Green Valley Apartment
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Tower B, Flat 502
                  </p>

                  <p className="text-sm text-slate-500">
                    Madhapur, Hyderabad
                  </p>
                </div>
              </div>

              <div className="mt-5 h-52 rounded-2xl bg-slate-100">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <MapPin
                      className="mx-auto text-blue-600"
                      size={32}
                    />

                    <p className="mt-2 text-sm font-semibold">
                      Map Preview
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Google Maps will be connected later
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* VEHICLE */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Car />
                </div>

                <div>
                  <p className="font-bold">
                    Hyundai Creta
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    SUV • White • OD 02 AB 1234
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">
                Job Summary
              </h2>

              <div className="mt-5 space-y-4">
                <Summary
                  label="Service"
                  value="Premium Wash"
                />

                <Summary
                  label="Scheduled"
                  value="10:30 AM"
                />

                <Summary
                  label="Distance"
                  value="1.8 km"
                />

                <Summary
                  label="Duration"
                  value="60 min"
                />

                <Summary
                  label="Your Earning"
                  value="₹350"
                  green
                />
              </div>
            </section>

            <div className="rounded-3xl bg-blue-600 p-6 text-white">
              <Navigation size={26} />

              <h2 className="mt-4 text-xl font-bold">
                Ready to go?
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Start navigation to the customer's service
                location.
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/washer/jobs/${jobId}/navigation`
                  )
                }
                className="mt-5 w-full rounded-xl bg-white py-3.5 font-semibold text-blue-700"
              >
                Start Navigation
              </button>
            </div>

            <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
              <Clock3 className="shrink-0" size={19} />

              Please reach the customer location before the
              scheduled service time.
            </div>
          </aside>
        </div>
  );
}

export default WasherJobDetailsContent;
