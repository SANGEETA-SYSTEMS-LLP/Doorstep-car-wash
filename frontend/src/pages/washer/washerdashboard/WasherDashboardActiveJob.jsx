import { MapPin, Navigation } from "lucide-react";
import JobInfo from "./JobInfo";

function WasherDashboardActiveJob({ activeJob, navigate }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                      <p className="text-xs font-bold uppercase tracking-wider text-green-600">
                        Active Job
                      </p>
                    </div>

                    <h2 className="mt-2 text-2xl font-bold">
                      {activeJob.service}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {activeJob.id}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                    Accepted
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <JobInfo
                    label="Customer"
                    value={activeJob.customer.name}
                  />

                  <JobInfo
                    label="Vehicle"
                    value={activeJob.vehicle.name}
                  />

                  <JobInfo
                    label="Distance"
                    value={`${activeJob.distance} km`}
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <div className="flex gap-3">
                    <MapPin className="shrink-0 text-blue-600" />

                    <div>
                      <p className="font-bold">
                        {activeJob.location.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {activeJob.location.address}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/washer/jobs/${activeJob.id}`
                    )
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white"
                >
                  View Active Job
                  <Navigation size={18} />
                </button>
              </section>
  );
}

export default WasherDashboardActiveJob;
