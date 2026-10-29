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
    <article
      className="block rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-colors duration-150 hover:border-green-200 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold tracking-tight text-slate-950">{job.booking_number}</p>
          <p className="mt-1 text-sm text-slate-500">{job.package?.name || "Car Wash"} · {job.status === "pending" ? "New booking request" : "Booking update"}</p>
        </div>
        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold capitalize text-green-800 ring-1 ring-green-100">{status}</span>
      </div>
      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
        <JobDetail label="Customer" value={job.customer?.name || "Customer"} />
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
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <Link to={"/supervisor/jobs/" + job.id} className="inline-flex min-h-11 items-center rounded-xl bg-green-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-950">{job.assigned_washer_id ? "View job" : "Review details & assign"}</Link>
        {job.customer?.phone && <a href={"tel:" + job.customer.phone} className="inline-flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">Call customer</a>}
      </div>
    </article>
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
