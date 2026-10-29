import { ContactButtons } from "../../../components/washer/WasherBookingCard";
import ServiceMap from "../../../components/map/ServiceMap";
import useDrivingRoute from "../../../hooks/useDrivingRoute";
import { coordinates } from "../../../services/locations/maps";
import { ArrowLeft, Clock3, MapPin, UserRound } from "lucide-react";


function WasherNavigationContent({ activeJob, navigate, jobId, handleArrived, currentLocation }) {
  const route = useDrivingRoute(currentLocation, activeJob?.location);
  const destination = coordinates(activeJob?.location);
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
              <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                {jobId}
              </p>

              <h1 className="font-bold">
                Navigate to Customer
              </h1>
            </div>
          </div>

          <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            On The Way
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-5 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* MAP */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <ServiceMap location={activeJob?.location} washerLocation={currentLocation} path={route.path} className="h-[520px]" />
            <div className="space-y-3 p-5">
              <p>Driving distance: {route.distance} km · ETA: {route.eta} min</p>
              {route.error && <p role="status" className="text-sm text-amber-800">Driving route unavailable.</p>}
              {destination ? <a className="inline-block rounded-xl bg-green-600 px-5 py-3 font-semibold text-white" target="_blank" rel="noreferrer" href={"https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(destination.lat + "," + destination.lng)}>Open Google Maps navigation</a> : <p role="alert">This booking is missing destination coordinates.</p>}
            </div>
          </section>

          {/* DETAILS */}

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
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

              <div className="mt-5"><ContactButtons phone={activeJob?.customer?.phone} /></div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex gap-3">
                <MapPin className="shrink-0 text-green-600" />

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

            <section className="rounded-3xl border border-green-200 bg-green-50 p-5">
              <div className="flex gap-3">
                <Clock3 className="shrink-0 text-green-600" />

                <div>
                  <p className="font-bold text-green-900">
                    Arrived at location?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    Mark arrived only after you reach the
                    customer's service location.
                  </p>
                </div>
              </div>

              <button
                onClick={handleArrived}
                className="mt-5 w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white"
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
