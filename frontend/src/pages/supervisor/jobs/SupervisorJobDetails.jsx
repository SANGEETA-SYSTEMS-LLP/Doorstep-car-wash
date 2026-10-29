import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import useSupervisorJobDetails from "./useSupervisorJobDetails";
import SupervisorBookingInformation from "./SupervisorBookingInformation";
import SupervisorAssignmentPanel from "./SupervisorAssignmentPanel";
import SupervisorServiceValidation from "./SupervisorServiceValidation";

export default function SupervisorJobDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const {
    job,
    address,
    washers,
    loading,
    assigningId,
    error,
    success,
    validating,
    loadJob,
    handleAssign,
    handleValidate,
  } = useSupervisorJobDetails(bookingId);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-gray-500">
        <LoaderCircle className="animate-spin" size={20} />
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>{error || "Booking not found."}</p>
        <button onClick={() => navigate("/supervisor/jobs")} className="mt-4 font-semibold underline">
          Back to jobs
        </button>
      </div>
    );
  }

  const canAssign = !job.assigned_washer_id &&
    ["pending", "confirmed", "finding_washer", "support_escalated"].includes(job.status);
  const status = job.status === "service_completed"
    ? "Awaiting validation"
    : job.status === "completed"
      ? "Completed"
      : job.assigned_washer_id
        ? "In Progress"
        : job.status?.replaceAll("_", " ");

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/supervisor/jobs")} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900">
        <ArrowLeft size={17} /> Back to jobs
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Supervisor <span className="px-1 text-slate-300">/</span> Active jobs</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Job details</h1>
          <p className="mt-1.5 text-sm text-slate-500">Booking #{job.booking_number}</p>
        </div>
        <span className="rounded-full bg-green-50 px-3.5 py-2 text-sm font-semibold capitalize text-green-800 ring-1 ring-green-100">
          {status}
        </span>
      </div>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} className="shrink-0" />
          <p>{success}</p>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <SupervisorBookingInformation job={job} address={address} />
        <SupervisorAssignmentPanel
          washers={washers}
          canAssign={canAssign}
          loading={loading}
          assigningId={assigningId}
          onRefresh={loadJob}
          onAssign={handleAssign}
        />
      </div>
      <SupervisorServiceValidation job={job} validating={validating} onValidate={handleValidate} />
    </div>
  );
}
