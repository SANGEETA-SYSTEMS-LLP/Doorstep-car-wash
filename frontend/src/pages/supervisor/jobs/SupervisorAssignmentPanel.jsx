import { RefreshCw } from "lucide-react";

function SupervisorAssignmentPanel({ washers, canAssign, loading, assigningId, onRefresh, onAssign }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-900">Washers and assignment</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500">Review the booking details, then send an offer. Customer washer details appear after the washer accepts. Offers can go up to 7 km. The washer can request an extra travel charge during service; the customer must approve it. Working hours and required service skills still need to be configured.</p>
      {!canAssign && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          This booking has already been accepted or is not eligible for assignment.
        </p>
      )}
      {canAssign && washers.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          No washer records were returned for this supervisor view. Refresh the list or check that the washer has a washer profile; matching location alone does not create a washer account record.
        </p>
      )}
      {canAssign && (
        <div className="mt-4 space-y-3">
          {washers.map((washer) => (
            <div key={washer.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{washer.name || "Washer"}</p>
                  <p className="mt-1 break-all text-xs text-gray-500">{washer.referenceId}</p>
                  <p className="mt-1 text-sm text-gray-600">{washer.phone || "Phone not provided"}</p>
                  <p className="mt-1 text-sm text-gray-600">{washer.address || "Washer address not saved"}</p>
                  <p className="mt-1 text-sm capitalize text-gray-600">{washer.status?.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm text-gray-500">{washer.serviceAddressMatched ? "Same service address as customer" : washer.distanceKm == null ? "Distance unavailable" : `${washer.distanceKm} km away`}</p>
                  {washer.extendedRadius && <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">Outside the normal {washer.serviceRadiusKm || 5} km radius. The customer must approve any travel charge requested by the washer.</p>}
                  <p className="mt-1 text-sm text-gray-500">
                    Rating: {washer.rating ?? 0} · Jobs completed: {washer.jobs_completed ?? 0}
                  </p>
                </div>
                <button
                  onClick={() => onAssign(washer.id)}
                  disabled={Boolean(assigningId) || !washer.eligible}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningId === washer.id ? "Assigning..." : "Assign washer"}
                </button>
              </div>
              {washer.reasons?.length > 0 && <ul className="mt-3 list-disc space-y-1 rounded-lg bg-amber-50 p-4 pl-8 text-sm text-amber-800">{washer.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default SupervisorAssignmentPanel;
