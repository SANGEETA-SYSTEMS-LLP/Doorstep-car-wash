import ServiceMap from "../../../components/map/ServiceMap";

export default function TrackBookingLiveMap({ booking, washerLocation, distance, eta, path, error }) {
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div><h2 className="font-bold">Washer location</h2><p className="mt-1 text-sm text-slate-500">{washerLocation ? "Latest reported location" : "Waiting for the washer to share their location"}</p></div>
      <p className="text-sm">Driving distance: {distance} km · ETA: {eta} min</p>
    </div>
    {error && <p role="status" className="px-5 pb-4 text-sm text-amber-800">Driving route unavailable. Location markers are shown when available.</p>}
    <ServiceMap location={booking.location} washerLocation={washerLocation} path={path} className="h-[550px]" />
    <p className="p-5 text-sm text-slate-600">{booking.location?.address || "Service address unavailable"}</p>
  </section>;
}
