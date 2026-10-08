import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  ChevronRight,
  Clock3,
  MapPin,
} from "lucide-react";

const jobs = [
  {
    id: "CW-2026-1028",
    service: "Premium Wash",
    vehicle: "Hyundai Creta",
    customer: "Gayatri Panda",
    time: "10:30 AM",
    distance: "1.8 km",
    status: "Active",
  },
  {
    id: "CW-2026-1022",
    service: "Basic Wash",
    vehicle: "Maruti Swift",
    customer: "Amit Sharma",
    time: "09:00 AM",
    distance: "2.1 km",
    status: "Completed",
  },
  {
    id: "CW-2026-1015",
    service: "Premium Wash",
    vehicle: "Tata Nexon",
    customer: "Rohit Das",
    time: "08:00 AM",
    distance: "3.2 km",
    status: "Completed",
  },
];

function WasherJobs() {
  const navigate = useNavigate();

  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Jobs
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          My Jobs
        </h1>

        <p className="mt-2 text-slate-500">
          View your active, upcoming and completed jobs.
        </p>

        <div className="mt-8 flex gap-2 overflow-x-auto">
          {[
            "All",
            "Active",
            "Upcoming",
            "Completed",
          ].map((item, index) => (
            <button
              key={item}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold ${
                index === 0
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Car />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-bold">
                        {job.service}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          job.status === "Active"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {job.vehicle} • {job.id}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Customer: {job.customer}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        Today
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock3 size={14} />
                        {job.time}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {job.distance}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/washer/jobs/${job.id}`
                    )
                  }
                  className="flex items-center justify-center gap-1 rounded-xl border border-blue-200 px-5 py-3 font-semibold text-blue-600"
                >
                  View Job
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WasherJobs;