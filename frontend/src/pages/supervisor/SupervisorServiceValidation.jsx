function SupervisorServiceValidation({ job, validating, onValidate }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Service validation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review the washer&apos;s before and after photos before completing the booking.
          </p>
        </div>
        {job.status === "service_completed" && (
          <button
            type="button"
            onClick={onValidate}
            disabled={validating}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
                  <img key={photo.id} src={photo.url} alt={`${title} vehicle`} className="h-36 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No service photos have been submitted yet.</p>
      )}
    </section>
  );
}

export default SupervisorServiceValidation;
