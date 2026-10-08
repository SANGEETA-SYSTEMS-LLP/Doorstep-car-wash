import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Car, CheckCircle2, Clock3, Play, Sparkles } from "lucide-react";
import { useWasher } from "../../../context/WasherContext";
import Summary from "./Summary";
import StageBadge from "./StageBadge";
import PhotoStage from "./PhotoStage";
import { serviceTasks } from "./data";
import OtpVerification from "./OtpVerification";
import ServiceChecklist from "./ServiceChecklist";

function WasherService() {
  const {
    washerState,
    verifyOtp: saveOtpVerification,
    markBeforePhotosAdded,
    startService: saveServiceStarted,
    setCompletedTasks: saveCompletedTasks,
    markAfterPhotosAdded,
    completeService,
    closeActiveJob,
  } = useWasher();

  const {
    activeJob,
    otpVerified,
    beforePhotosAdded,
    serviceStarted,
    completedTasks: savedTasks,
    afterPhotosAdded,
    serviceCompleted,
  } = washerState;

  const navigate = useNavigate();
  const { jobId } = useParams();

  const getInitialStage = () => {
    if (serviceCompleted) {
      return "completed";
    }

    if (afterPhotosAdded) {
      return "after";
    }

    if (serviceStarted) {
      return "service";
    }

    if (beforePhotosAdded) {
      return "before";
    }

    if (otpVerified) {
      return "before";
    }

    return "otp";
  };

  const [stage, setStage] = useState(getInitialStage);

  const [otp, setOtp] = useState("");

  const [beforePhotos, setBeforePhotos] =
    useState([]);

  const [afterPhotos, setAfterPhotos] =
    useState([]);

  const [completedTasks, setLocalCompletedTasks] =
    useState(savedTasks || []);

  const verifyOtp = () => {
    if (otp.length !== 4) return;

    if (otp !== "4826") {
      alert("Demo OTP is 4826");
      return;
    }

    saveOtpVerification();
    setStage("before");
  };

  const handleBeforePhotos = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    setBeforePhotos((previous) => [
      ...previous,
      ...files,
    ]);
  };

  const handleAfterPhotos = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    setAfterPhotos((previous) => [
      ...previous,
      ...files,
    ]);
  };

  const startService = () => {
    if (beforePhotos.length === 0) {
      return;
    }

    markBeforePhotosAdded();
    saveServiceStarted();
    setStage("service");
  };

  const toggleTask = (task) => {
    const newTasks = completedTasks.includes(task)
      ? completedTasks.filter((item) => item !== task)
      : [...completedTasks, task];

    setLocalCompletedTasks(newTasks);
    saveCompletedTasks(newTasks);
  };

  const allTasksCompleted =
    completedTasks.length ===
    serviceTasks.length;

  const moveToAfterPhotos = () => {
    if (!allTasksCompleted) return;

    setStage("after");
  };

  const completeJob = () => {
    if (afterPhotos.length === 0) {
      return;
    }

    markAfterPhotosAdded();
    completeService();
    setStage("completed");
  };

  if (!activeJob) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <Car size={40} className="mx-auto text-slate-300" />
          <h2 className="mt-4 text-xl font-bold">No Active Service</h2>
          <p className="mt-2 text-sm text-slate-500">
            There is currently no accepted customer booking.
          </p>
          <button
            onClick={() => navigate("/washer")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {jobId}
              </p>

              <h1 className="font-bold">
                Service Job
              </h1>
            </div>
          </div>

          <StageBadge stage={stage} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-5 lg:p-8">
        {/* JOB SUMMARY */}

        <div className="grid gap-4 sm:grid-cols-3">
          <Summary
            icon={<Car />}
            label="Vehicle"
            value={activeJob?.vehicle?.name || "Vehicle"}
          />

          <Summary
            icon={<Sparkles />}
            label="Service"
            value={activeJob?.service || "Car Wash"}
          />

          <Summary
            icon={<Clock3 />}
            label="Duration"
            value="60 Minutes"
          />
        </div>

        {/* OTP */}

        {stage === "otp" && (
          <OtpVerification otp={otp} setOtp={setOtp} verifyOtp={verifyOtp} />
        )}

        {/* BEFORE PHOTOS */}

        {stage === "before" && (
          <PhotoStage
            title="Before Service Photos"
            description="Take clear photos of the vehicle before starting the service."
            photos={beforePhotos}
            onChange={handleBeforePhotos}
            buttonText="Start Service"
            buttonIcon={<Play size={18} />}
            disabled={beforePhotos.length === 0}
            onContinue={startService}
          />
        )}

        {/* SERVICE */}

        {stage === "service" && (
          <ServiceChecklist activeJob={activeJob} completedTasks={completedTasks} toggleTask={toggleTask} allTasksCompleted={allTasksCompleted} moveToAfterPhotos={moveToAfterPhotos} />
        )}

        {/* AFTER PHOTOS */}

        {stage === "after" && (
          <PhotoStage
            title="After Service Photos"
            description="Upload final photos showing the completed car wash."
            photos={afterPhotos}
            onChange={handleAfterPhotos}
            buttonText="Complete Job"
            buttonIcon={
              <CheckCircle2 size={18} />
            }
            disabled={
              afterPhotos.length === 0
            }
            onContinue={completeJob}
          />
        )}

        {/* COMPLETED */}

        {stage === "completed" && (
          <section className="mx-auto mt-10 max-w-xl rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={42} />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-green-600">
              Job Completed
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Great work!
            </h2>

            <p className="mt-3 leading-7 text-slate-500">
              The service has been marked completed.
              The customer can now review and confirm the
              service.
            </p>

            <div className="mt-7 rounded-2xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Your earning
              </p>

              <p className="mt-1 text-3xl font-bold text-green-700">
                ₹{activeJob?.earning || 0}
              </p>
            </div>

            <button
              onClick={() => {
                closeActiveJob();
                navigate("/washer");
              }}
              className="mt-7 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white"
            >
              Back to Dashboard
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default WasherService;
