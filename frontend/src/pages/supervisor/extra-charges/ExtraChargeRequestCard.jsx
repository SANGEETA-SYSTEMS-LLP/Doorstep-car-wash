function ExtraChargeRequestCard({ request, processing, onReview }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
            {request.booking?.booking_number}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{request.reason}</h3>
          <p className="mt-2 text-sm text-slate-500">{request.booking?.service_address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Requested</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            ₹{Number(request.requested_amount).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          disabled={processing}
          onClick={() => onReview(request.id, "reject")}
          className="min-h-11 flex-1 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          disabled={processing}
          onClick={() => onReview(request.id, "approve")}
          className="min-h-11 flex-1 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

export default ExtraChargeRequestCard;
