function ServicePhotos({ beforePhotos, afterPhotos, loading, error, onRefresh, onError }) {
  const groups = [
    ["Before Service", beforePhotos, "before"],
    ["After Service", afterPhotos, "after"],
  ];

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
      <div>
        <h2 className="text-xl font-bold">Service Photos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Compare the vehicle condition before and after the service.
        </p>
      </div>
      {loading && <p role="status" className="mt-6 text-slate-500">Loading service photos...</p>}
      {error && <p role="alert" className="mt-6 text-red-600">{error}</p>}
      {!loading && (
        <button type="button" onClick={onRefresh} className="mt-4 text-sm font-semibold text-blue-600">
          Refresh photos
        </button>
      )}
      {!loading && (
        <div className="mt-7 grid gap-6 md:grid-cols-2">
          {groups.map(([title, items, type]) => (
            <div key={type}>
              <h3 className="mb-3 font-bold">{title}</h3>
              {!error && items.length === 0 && <p className="text-sm text-slate-500">No photos available.</p>}
              <div className="grid grid-cols-2 gap-3">
                {items.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={`Vehicle ${type} service`}
                    className="h-40 w-full rounded-xl object-cover"
                    onError={() => onError("A photo could not be loaded. Refresh photos to try again.")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ServicePhotos;
