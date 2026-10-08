import { ArrowLeft, Clock3, MapPin, MessageCircle, Navigation, Phone, UserRound } from "lucide-react";
import MapInfo from "./MapInfo";

function WasherNavigationContent({ activeJob, navigate, jobId, handleArrived }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {jobId}
              </p>

              <h1 className="font-bold">
                Navigate to Customer
              </h1>
            </div>
          </div>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            On The Way
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* MAP */}

          <section className="relative min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                backgroundSize: "45px 45px",
              }}
            />

            {/* Roads */}

            <div className="absolute left-0 top-[44%] h-14 w-full -rotate-6 bg-white shadow-sm" />

            <div className="absolute left-[45%] top-0 h-full w-16 rotate-12 bg-white shadow-sm" />

            {/* ROUTE */}

            <div className="absolute left-[25%] top-[65%] h-2 w-[47%] -rotate-[28deg] rounded-full bg-blue-500" />

            {/* WASHER */}

            <div className="absolute bottom-[18%] left-[19%]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-xl">
                <Navigation size={21} />
              </div>

              <div className="mt-2 rounded-lg bg-white px-3 py-1 text-xs font-bold shadow">
                You
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="absolute right-[22%] top-[25%]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-red-500 text-white shadow-xl">
                <MapPin size={24} />
              </div>

              <div className="mt-2 whitespace-nowrap rounded-lg bg-white px-3 py-1 text-xs font-bold shadow">
                Customer
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-3">
                <MapInfo
                  label="Distance"
                  value={`${activeJob?.distance || 0} km`}
                />

                <MapInfo
                  label="ETA"
                  value="12 min"
                />

                <MapInfo
                  label="Scheduled"
                  value={activeJob?.time || "Not available"}
                />
              </div>
            </div>
          </section>

          {/* DETAILS */}

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserRound />
                </div>

                <div>
                  <p className="font-bold">
                    {activeJob?.customer?.name || "Customer"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeJob?.service || "Car Wash"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold">
                  <Phone size={17} />
                  Call
                </button>

                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold">
                  <MessageCircle size={17} />
                  Message
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex gap-3">
                <MapPin className="shrink-0 text-blue-600" />

                <div>
                  <p className="font-bold">
                    {activeJob?.location?.name || "Customer Location"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activeJob?.location?.address || ""}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex gap-3">
                <Clock3 className="shrink-0 text-blue-600" />

                <div>
                  <p className="font-bold text-blue-900">
                    Arrived at location?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    Mark arrived only after you reach the
                    customer's service location.
                  </p>
                </div>
              </div>

              <button
                onClick={handleArrived}
                className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white"
              >
                I've Arrived
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default WasherNavigationContent;
