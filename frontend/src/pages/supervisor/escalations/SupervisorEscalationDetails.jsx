import { ArrowLeft, AlertTriangle, CheckCircle, LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import useEscalationDetails from "./useEscalationDetails";
import EscalationOverview from "./EscalationOverview";
import EscalationAssignment from "./EscalationAssignment";

export default function SupervisorEscalationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const {
    booking,
    address,
    washers,
    loading,
    assigningId,
    error,
    success,
    loadDetails,
    handleAssign,
  } = useEscalationDetails(bookingId);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-gray-500">
        <LoaderCircle size={20} className="animate-spin" />
        Loading escalation details...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <p>{error || "Booking not found."}</p>
        <button onClick={() => navigate("/supervisor/escalations")} className="mt-4 font-medium underline">
          Back to escalations
        </button>
      </div>
    );
  }

  const canAssign = !booking.assigned_washer_id &&
    booking.requires_supervisor === true &&
    ["pending", "confirmed", "finding_washer", "support_escalated"].includes(booking.status);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/supervisor/escalations")}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={17} /> Back to escalations
      </button>
      <div>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle size={20} />
          <span className="text-sm font-semibold">Supervisor intervention</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Escalation details</h1>
        <p className="mt-1 text-sm text-gray-500">Booking #{booking.booking_number}</p>
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} className="shrink-0" />
          <p>{success}</p>
        </div>
      )}
      <EscalationOverview booking={booking} address={address} />
      <EscalationAssignment
        booking={booking}
        washers={washers}
        canAssign={canAssign}
        loading={loading}
        assigningId={assigningId}
        success={success}
        onRefresh={loadDetails}
        onAssign={handleAssign}
        navigate={navigate}
      />
    </div>
  );
}
