import { RefreshCw, UserRound } from "lucide-react";

function EscalationAssignment({ booking, washers, canAssign, loading, assigningId, success, onRefresh, onAssign, navigate }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Assign a washer</h2>
          <p className="mt-1 text-sm text-gray-500">Available washers are sorted by distance.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading || Boolean(assigningId)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {!canAssign && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          {booking.assigned_washer_id
            ? "This booking already has an assigned washer."
            : "This booking is not eligible for manual assignment. Check its status and supervisor flag."}
        </div>
      )}
      {canAssign && washers.length === 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          No eligible washers with location data were found within their service radius.
        </div>
      )}
      {canAssign && washers.length > 0 && (
        <div className="mt-4 space-y-3">
          {washers.map((washer) => (
            <div key={washer.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-50 p-2 text-green-700"><UserRound size={20} /></div>
                <div>
                  <p className="font-semibold text-gray-900">Washer {washer.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm text-gray-500">{washer.distanceKm} km away</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Rating: {washer.rating ?? 0} · Jobs completed: {washer.jobs_completed ?? 0}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onAssign(washer.id)}
                disabled={Boolean(assigningId)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assigningId === washer.id ? "Assigning..." : "Assign washer"}
              </button>
            </div>
          ))}
        </div>
      )}
      {success && (
        <button
          onClick={() => navigate("/supervisor/escalations")}
          className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Return to escalations
        </button>
      )}
    </section>
  );
}

export default EscalationAssignment;
