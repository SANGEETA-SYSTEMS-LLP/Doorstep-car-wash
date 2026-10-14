import { Link } from "react-router-dom";

function SupervisorJobCard({ job }) {
  const status = job.status === "service_completed"
    ? "Awaiting validation"
    : job.status === "completed"
      ? "Completed"
      : job.assigned_washer_id
        ? "In Progress"
        : job.status.replaceAll("_", " ");

  return (
    <Link
      to={`/supervisor/jobs/${job.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-900">{job.booking_number}</p>
          <p className="mt-1 text-sm text-slate-500">{job.package?.name || "Car Wash"}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">{status}</span>
      </div>
      <div className="mt-5 grid gap-4 text-sm md:grid-cols-4">
        <JobDetail label="Vehicle" value={job.vehicle ? `${job.vehicle.brand} ${job.vehicle.model}` : "-"} />
        <JobDetail label="Location" value={job.service_address} />
        <JobDetail label="Schedule" value={`${job.scheduled_date} ${job.scheduled_time}`} />
        <JobDetail label="Amount" value={`₹${Number(job.total_amount || 0).toLocaleString("en-IN")}`} />
      </div>
      {job.requires_supervisor && (
        <div className="mt-5 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
          Supervisor attention required
        </div>
      )}
    </Link>
  );
}

function JobDetail({ label, value }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default SupervisorJobCard;
