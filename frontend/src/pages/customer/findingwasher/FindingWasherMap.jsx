import { CheckCircle2, MapPin } from "lucide-react";
import WasherMarker from "./WasherMarker";

function FindingWasherMap({ washerFound }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="font-bold">
                  Live Assignment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Searching around your service location
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                LIVE
              </div>
            </div>

            <div className="relative h-[620px] overflow-hidden bg-slate-100">
              {/* MOCK MAP GRID */}

              <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] bg-[size:50px_50px]" />

              {/* MOCK ROADS */}

              <div className="absolute left-[-5%] top-[25%] h-7 w-[110%] rotate-6 bg-white shadow-sm" />

              <div className="absolute left-[30%] top-[-20%] h-[140%] w-8 -rotate-12 bg-white shadow-sm" />

              <div className="absolute left-[-10%] top-[70%] h-6 w-[120%] -rotate-6 bg-white shadow-sm" />

              {/* SEARCH RADIUS */}

              {!washerFound && (
                <>
                  <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-blue-400 bg-blue-400/10" />

                  <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/50" />
                </>
              )}

              {/* CUSTOMER LOCATION */}

              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-8 ring-blue-600/15">
                  <MapPin size={28} />
                </div>

                <div className="absolute left-1/2 top-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-bold shadow-lg">
                  Your Location
                </div>
              </div>

              {/* AVAILABLE WASHERS */}

              <WasherMarker
                className="left-[20%] top-[25%]"
                label="2.4 km"
              />

              <WasherMarker
                className="right-[17%] top-[28%]"
                label="3.1 km"
              />

              <WasherMarker
                className="bottom-[18%] left-[23%]"
                label="1.8 km"
              />

              {washerFound && (
                <div className="absolute bottom-5 left-5 right-5 z-30 rounded-2xl border border-green-100 bg-white p-5 shadow-xl sm:left-auto sm:w-96">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <CheckCircle2 />
                    </div>

                    <div>
                      <p className="font-bold">
                        Washer found!
                      </p>

                      <p className="text-sm text-slate-500">
                        Rahul Kumar accepted your job.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
  );
}

export default FindingWasherMap;
