import { useEffect, useRef, useState } from "react";
import { getCustomerExtraCharges, respondToExtraCharge } from "../../../services/booking/extraChargeService";
import { getBookingById } from "../../../services/booking/bookingService";

function ExtraChargeRequests({ bookingId, onBookingUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(null);
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const version = useRef(0);

  useEffect(() => {
    let active = true;
    let fetching = false;
    const load = async () => {
      if (fetching || busy.current || !bookingId) return;
      fetching = true;
      const requestVersion = version.current;
      try {
        const data = await getCustomerExtraCharges(bookingId);
        if (active && requestVersion === version.current) {
          setRequests(data.requests || []);
        }
      } catch (error) {
        if (active) setError(error.message || "Unable to load additional service requests.");
      } finally {
        fetching = false;
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [bookingId]);

  const respond = async (request, action) => {
    if (busy.current) return;
    busy.current = true;
    version.current += 1;
    setResponding(request.id);
    setError("");
    setNotice("");
    try {
      const result = await respondToExtraCharge(bookingId, request.id, action);
      const status = result.request?.status || (result.approved ? "customer_approved" : "customer_rejected");
      setRequests((previous) => previous.map((item) => item.id === request.id ? { ...item, status } : item));
      setNotice(result.approved
        ? "Additional charge approved. Updated booking total: ₹" + Number(result.totalAmount).toLocaleString("en-IN")
        : "Additional charge rejected.");
      try {
        onBookingUpdate?.(await getBookingById(bookingId));
      } catch (refreshError) {
        console.error("Refresh booking after extra charge decision:", refreshError);
      }
    } catch (error) {
      setError(error.message || "Unable to respond to additional charge.");
    } finally {
      version.current += 1;
      busy.current = false;
      setResponding(null);
    }
  };

  if (!bookingId) return null;
  return (
    <section className="mx-auto max-w-7xl space-y-4 px-6 pt-6 lg:px-8" aria-label="Additional service requests">
      {loading && <p role="status" className="text-sm text-slate-500">Checking additional service requests...</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{notice}</p>}
      {requests.map((request) => (
        <div key={request.id} className="rounded-2xl border border-amber-200 bg-white p-6">
          <h2 className="text-xl font-bold">Additional Service Charge</h2>
          <p className="mt-3 text-slate-600">{request.reason}</p>
          <p className="mt-4 text-sm text-slate-500">{request.status === "customer_approved" ? "Approved charge" : "Requested amount"}</p>
          <p className="mt-1 text-2xl font-bold">₹{Number(request.requested_amount).toLocaleString("en-IN")}</p>
          {request.status === "pending" && <p className="mt-3 text-sm text-amber-700">Waiting for supervisor review.</p>}
          {request.status === "approved" && <>
            <p className="mt-3 text-sm text-green-700">Supervisor verified this request. Your approval is needed to add it to the booking total.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={responding !== null} onClick={() => respond(request, "reject")} className="rounded-xl border border-red-200 px-6 py-3 font-semibold text-red-600 disabled:opacity-50">Reject</button>
              <button type="button" disabled={responding !== null} onClick={() => respond(request, "approve")} className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white disabled:opacity-50">
                {responding === request.id ? "Processing..." : "Approve ₹" + Number(request.requested_amount).toLocaleString("en-IN")}
              </button>
            </div>
          </>}
          {request.status === "customer_approved" && <p className="mt-3 text-sm font-medium text-green-700">Approved by you and recorded on this booking.</p>}
          {request.status === "customer_rejected" && <p className="mt-3 text-sm text-slate-600">Declined by you. This charge was not added to the booking.</p>}
          {request.status === "rejected" && <p className="mt-3 text-sm text-slate-600">Not approved by the supervisor.</p>}
        </div>
      ))}
    </section>
  );
}

export default ExtraChargeRequests;
