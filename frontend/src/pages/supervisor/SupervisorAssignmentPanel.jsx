import { RefreshCw } from "lucide-react";

function SupervisorAssignmentPanel({ washers, canAssign, loading, assigningId, onRefresh, onAssign }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-900">Accept booking and assign washer</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {!canAssign && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          This booking has already been accepted or is not eligible for assignment.
        </p>
      )}
      {canAssign && washers.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          No eligible washers with available location data were found within their service radius.
        </p>
      )}
      {canAssign && (
        <div className="mt-4 space-y-3">
          {washers.map((washer) => (
            <div key={washer.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Washer {washer.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-gray-500">{washer.distanceKm} km away</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Rating: {washer.rating ?? 0} · Jobs completed: {washer.jobs_completed ?? 0}
                  </p>
                </div>
                <button
                  onClick={() => onAssign(washer.id)}
                  disabled={Boolean(assigningId)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningId === washer.id ? "Assigning..." : "Accept and assign"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SupervisorAssignmentPanel;
