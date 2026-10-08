import { useNavigate } from "react-router-dom";
import { Banknote, BriefcaseBusiness, CheckCircle2, Power, Star, TrendingUp } from "lucide-react";
import { useWasher } from "../../../context/WasherContext";
import StatCard from "./StatCard";
import WasherDashboardIncomingJob from "./WasherDashboardIncomingJob";
import WasherDashboardActiveJob from "./WasherDashboardActiveJob";
import DashboardSidebar from "./DashboardSidebar";

function WasherDashboard() {
  const { washerState, setOnline, acceptJob, rejectJob } = useWasher();
  const { online, activeJob, jobStatus, todayJobs, todayEarnings } = washerState;
  const navigate = useNavigate();

  const job = {
    id: "CW-2026-1028",

    customer: {
      name: "Gayatri Panda",
    },

    service: "Premium Wash",

    vehicle: {
      name: "Hyundai Creta",
      type: "SUV",
      number: "OD 02 AB 1234",
      colour: "White",
    },

    location: {
      name: "Green Valley Apartment",
      address:
        "Tower B, Flat 502, Madhapur",
    },

    amount: 499,
    earning: 350,
    distance: 1.8,
    time: "10:30 AM",
  };

  const handleAcceptJob = () => {
    acceptJob(job);
  };

  const handleRejectJob = () => {
    rejectJob();
  };

  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
              Washer Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Good afternoon, Rahul 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your jobs and earnings from here.
            </p>
          </div>

          {/* ONLINE */}

          <button
            onClick={() =>
              setOnline(!online)
            }
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 font-semibold transition ${
              online
                ? "bg-green-600 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            <Power size={19} />

            {online
              ? "Online — Available"
              : "Offline"}
          </button>
        </div>

        {/* OFFLINE WARNING */}

        {!online && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Power className="shrink-0 text-amber-600" />

            <div>
              <p className="font-bold text-amber-800">
                You are currently offline
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Go online to start receiving nearby
                car-wash requests.
              </p>
            </div>
          </div>
        )}

        {/* STATS */}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<BriefcaseBusiness />}
            label="Today's Jobs"
            value={todayJobs}
            text={`${todayJobs} completed`}
          />

          <StatCard
            icon={<Banknote />}
            label="Today's Earnings"
            value={`₹${todayEarnings}`}
            text={
              activeJob
                ? `+₹${activeJob.earning} current job`
                : "No active earning"
            }
          />

          <StatCard
            icon={<Star />}
            label="Rating"
            value="4.8"
            text="326 services"
          />

          <StatCard
            icon={<TrendingUp />}
            label="This Month"
            value="₹28,650"
            text="72 completed jobs"
          />
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            {/* INCOMING JOB */}

            {online &&
              !activeJob &&
              jobStatus !== "rejected" && (
                <WasherDashboardIncomingJob job={job} handleAcceptJob={handleAcceptJob} handleRejectJob={handleRejectJob} />
              )}

            {/* ACTIVE JOB */}

            {activeJob && (
              <WasherDashboardActiveJob activeJob={activeJob} navigate={navigate} />
            )}

            {/* NO REQUEST */}

            {online &&
              !activeJob &&
              jobStatus === "rejected" && (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                  <CheckCircle2
                    size={40}
                    className="mx-auto text-green-500"
                  />

                  <h2 className="mt-4 text-xl font-bold">
                    You're available
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Waiting for nearby customer bookings.
                  </p>
                </div>
              )}
          </div>

          {/* RIGHT */}

          <DashboardSidebar online={online} />
        </div>
      </div>
    </div>
  );
}

export default WasherDashboard;
