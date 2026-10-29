function SupervisorServiceValidation({ job, validating, onValidate }) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 className="text-lg font-bold text-slate-950">Service validation</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
            Review the washer&apos;s before and after photos before completing the booking.
          </p>
        </div>
        {job.status === "service_completed" && (
          <button
            type="button"
            onClick={onValidate}
            disabled={validating}
            className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {validating ? "Validating..." : "Validate and complete"}
          </button>
        )}
        {job.status === "completed" && (
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
            Booking completed
          </span>
        )}
      </div>
      {job.servicePhotos?.length ? (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {[["Before service", "before"], ["After service", "after"]].map(([title, type]) => (
            <div key={type}>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
              <div className="grid grid-cols-2 gap-3">
                {job.servicePhotos.filter((photo) => photo.photo_type === type).map((photo) => (
                  <img key={photo.id} src={photo.url} alt={`${title} vehicle`} loading="lazy" decoding="async" className="h-36 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No service photos have been submitted yet.</p>
      )}
    </section>
  );
}

export default SupervisorServiceValidation;
