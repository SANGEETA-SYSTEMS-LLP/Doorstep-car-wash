function ExtraChargeRequestCard({ request, processing, onReview }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {request.booking?.booking_number}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{request.reason}</h3>
          <p className="mt-2 text-sm text-slate-500">{request.booking?.service_address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-slate-400">Requested</p>
          <p className="text-2xl font-black text-slate-900">
            ₹{Number(request.requested_amount).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          disabled={processing}
          onClick={() => onReview(request.id, "reject")}
          className="flex-1 rounded-xl border border-red-200 px-5 py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          disabled={processing}
          onClick={() => onReview(request.id, "approve")}
          className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

export default ExtraChargeRequestCard;
