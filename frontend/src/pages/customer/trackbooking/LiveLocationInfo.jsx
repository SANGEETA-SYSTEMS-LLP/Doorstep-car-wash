function LiveLocationInfo({ location }) {
  if (!location) return null;
  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-400">Live Washer Location</p>
      <p className="mt-2 font-bold">
        {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Updated {new Date(location.updated_at).toLocaleTimeString()}
      </p>
    </div>
  );
}

export default LiveLocationInfo;
