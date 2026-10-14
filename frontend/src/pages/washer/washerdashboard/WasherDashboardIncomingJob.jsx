import { BriefcaseBusiness, MapPin, UserRound } from "lucide-react";
import JobInfo from "./JobInfo";

function WasherDashboardIncomingJob({ job, incomingJob, responding, handleAcceptJob, handleRejectJob }) {
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-blue-300 bg-white shadow-lg">
                  <div className="flex items-center justify-between bg-blue-600 p-5 text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                        New Job Request
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        {incomingJob?.booking_number}
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                      <BriefcaseBusiness />
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound />
                      </div>

                      <div>
                        <p className="font-bold">
                          {job.customer.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Customer
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <JobInfo
                        label="Service"
                        value={incomingJob?.package?.name || "Car Wash"}
                      />

                      <JobInfo
                        label="Vehicle"
                        value={incomingJob?.vehicle
                          ? `${incomingJob.vehicle.brand} ${incomingJob.vehicle.model}`
                          : "Vehicle"}
                      />

                      <JobInfo
                        label="Distance"
                        value={job.distance == null ? "Not available" : `${job.distance} km`}
                      />

                      <JobInfo
                        label="Scheduled"
                        value={incomingJob?.scheduled_time}
                      />
                    </div>

                    <div className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4">
                      <MapPin
                        size={20}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />

                      <div>
                        <p className="font-semibold">
                          {incomingJob?.service_address}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {incomingJob?.tower && `${incomingJob.tower} • `}
                          {incomingJob?.flat_number && `Flat ${incomingJob.flat_number}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div>
                        <p className="text-xs text-slate-400">
                          Final earning
                        </p>

                        <p className="text-2xl font-bold text-green-600">
                          {job.earning == null ? "Available after payment" : `₹${job.earning}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          Total amount
                        </p>

                        <p className="font-bold">
                          ₹{Number(incomingJob?.total_amount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        disabled={responding}
                        onClick={handleRejectJob}
                        className="rounded-xl border border-red-200 bg-red-50 py-3.5 font-semibold text-red-600"
                      >
                        Reject
                      </button>

                      <button
                        disabled={responding}
                        onClick={handleAcceptJob}
                        className="rounded-xl bg-green-600 py-3.5 font-semibold text-white"
                      >
                        Accept Job
                      </button>
                    </div>
                  </div>
                </section>
  );
}

export default WasherDashboardIncomingJob;
