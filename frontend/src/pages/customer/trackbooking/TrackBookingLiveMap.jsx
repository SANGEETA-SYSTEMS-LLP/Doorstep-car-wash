import { Car, MapPin } from "lucide-react";

function TrackBookingLiveMap({ booking, washer, distance, eta, progress }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 className="font-bold">
                  Live Location
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Washer location updates automatically
                </p>
              </div>

              <div className="flex gap-3">
                <div className="rounded-xl bg-slate-50 px-4 py-2">
                  <p className="text-[10px] uppercase text-slate-400">
                    Distance
                  </p>

                  <p className="text-sm font-bold">
                    {distance} km
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 px-4 py-2">
                  <p className="text-[10px] uppercase text-blue-400">
                    ETA
                  </p>

                  <p className="text-sm font-bold text-blue-700">
                    {eta} min
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-[650px] overflow-hidden bg-slate-100">
              {/* GRID */}

              <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] bg-[size:50px_50px]" />

              {/* ROADS */}

              <div className="absolute left-[-10%] top-[30%] h-7 w-[120%] rotate-6 bg-white shadow-sm" />

              <div className="absolute left-[25%] top-[-20%] h-[140%] w-8 -rotate-12 bg-white shadow-sm" />

              <div className="absolute left-[-10%] top-[72%] h-7 w-[120%] -rotate-6 bg-white shadow-sm" />

              {/* ROUTE */}

              <div
                className="absolute left-[20%] top-[56%] h-2 origin-left rotate-[-15deg] rounded-full bg-blue-400/60 transition-all duration-1000"
                style={{
                  width: `${Math.max(15, 62 - progress / 2)}%`,
                }}
              />

              {/* WASHER */}

              <div
                className="absolute z-20 transition-all duration-1000"
                style={{
                  left: `${progress}%`,
                  top: `${60 - progress / 4}%`,
                }}
              >
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-xl">
                    <Car size={23} />
                  </div>

                  <div className="absolute left-1/2 top-16 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow">
                    {washer?.name?.split(" ")[0] || "Washer"} • {eta} min
                  </div>
                </div>
              </div>

              {/* CUSTOMER */}

              <div className="absolute right-[16%] top-[32%] z-20">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-8 ring-blue-600/15">
                    <MapPin size={28} />
                  </div>

                  <div className="absolute left-1/2 top-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-bold shadow">
                    Your Location
                  </div>
                </div>
              </div>

              {/* LOCATION CARD */}

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-5 shadow-xl sm:right-auto sm:w-96">
                <div className="flex gap-3">
                  <MapPin
                    size={20}
                    className="mt-1 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="font-bold">
                      {booking.location?.name || "Service Location"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {booking.address?.tower || ""}
                      {booking.address?.flatNumber &&
                        `, Flat ${booking.address.flatNumber}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
  );
}

export default TrackBookingLiveMap;
