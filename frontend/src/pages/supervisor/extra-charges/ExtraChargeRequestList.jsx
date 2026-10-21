import ExtraChargeRequestCard from "./ExtraChargeRequestCard";

function ExtraChargeRequestList({ requests, processingId, onReview }) {
  return (
    <div className="mt-8 space-y-5">
      {requests.map((request) => (
        <ExtraChargeRequestCard
          key={request.id}
          request={request}
          processing={processingId === request.id}
          onReview={onReview}
        />
      ))}
      {!requests.length && (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
          No pending extra charge requests.
        </div>
      )}
    </div>
  );
}

export default ExtraChargeRequestList;
