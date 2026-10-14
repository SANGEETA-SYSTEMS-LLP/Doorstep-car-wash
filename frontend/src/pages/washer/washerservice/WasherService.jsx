import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWasher } from "../../../context/WasherContext";
import useServiceChecklist from "./useServiceChecklist";
import useWasherServiceActions from "./useWasherServiceActions";
import WasherServiceHeader from "./WasherServiceHeader";
import WasherServiceStages from "./WasherServiceStages";
import NoActiveService from "./NoActiveService";

function WasherService() {
  const context = useWasher();
  const { washerState } = context;
  const {
    activeJob,
    otpVerified,
    beforePhotosAdded,
    serviceStarted,
    afterPhotosAdded,
    serviceCompleted,
  } = washerState;
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [stage, setStage] = useState(() => {
    if (serviceCompleted) return "completed";
    if (afterPhotosAdded) return "after";
    if (serviceStarted) return "service";
    if (beforePhotosAdded || otpVerified) return "before";
    return "otp";
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const checklist = useServiceChecklist(activeJob, serviceStarted, setError);
  const actions = useWasherServiceActions({
    activeJob,
    otp,
    beforePhotos,
    afterPhotos,
    allTasksCompleted: checklist.allTasksCompleted,
    loading,
    validating,
    setError,
    setLoading,
    setValidating,
    setStage,
    verifyOtp: context.verifyOtp,
    markBeforePhotosAdded: context.markBeforePhotosAdded,
    startService: context.startService,
    markAfterPhotosAdded: context.markAfterPhotosAdded,
    completeService: context.completeService,
    updateJobStatus: context.updateJobStatus,
  });

  if (!activeJob) {
    return <NoActiveService onDashboard={() => navigate("/washer")} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WasherServiceHeader
        jobId={jobId}
        stage={stage}
        activeJob={activeJob}
        onBack={() => navigate(-1)}
      />
      <main className="mx-auto max-w-6xl p-5 lg:p-8">
        {error && stage !== "otp" && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}
        <WasherServiceStages
          stage={stage}
          otp={otp}
          setOtp={setOtp}
          error={error}
          loading={loading}
          beforePhotos={beforePhotos}
          afterPhotos={afterPhotos}
          checklist={checklist.checklist}
          checklistLoading={checklist.loading}
          savingTask={checklist.saving}
          retryChecklist={checklist.retry}
          activeJob={activeJob}
          allTasksCompleted={checklist.allTasksCompleted}
          toggleTask={checklist.toggleTask}
          moveToAfterPhotos={() => checklist.allTasksCompleted && setStage("after")}
          onVerifyOtp={actions.handleVerifyOtp}
          onBeforePhotos={(event) => setBeforePhotos(Array.from(event.target.files || []).slice(0, 5))}
          onStartService={actions.handleStartService}
          onAfterPhotos={(event) => setAfterPhotos(Array.from(event.target.files || []).slice(0, 5))}
          onCompleteJob={actions.completeJob}
          jobStatus={washerState.jobStatus}
          validating={validating}
          onValidate={actions.validateJob}
          onDashboard={() => {
            context.closeActiveJob();
            navigate("/washer");
          }}
        />
      </main>
    </div>
  );
}

export default WasherService;
