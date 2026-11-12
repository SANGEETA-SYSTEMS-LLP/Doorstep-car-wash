import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWasher } from "../../../context/WasherContext";
import useServiceChecklist from "./useServiceChecklist";
import useWasherServiceActions from "./useWasherServiceActions";
import WasherServiceHeader from "./WasherServiceHeader";
import WasherServiceStages from "./WasherServiceStages";
import NoActiveService from "./NoActiveService";
import { getWasherJob, toActiveJob } from "../../../services/washer/washerWorkspaceService";

function WasherService() {
  const context = useWasher();
  const { washerState } = context;
  const {
    activeJob,
    serviceStarted,
    afterPhotosAdded,
    serviceCompleted,
  } = washerState;
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [stage, setStage] = useState(() =>
    serviceCompleted ? "completed" : afterPhotosAdded ? "after" : serviceStarted ? "service" : "before"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState("");
  const { restoreJob } = context;
  useEffect(() => {
    let mounted = true;
    setJobLoading(true);
    setJobError("");
    getWasherJob(jobId)
      .then(({ booking }) => {
        if (!mounted) return;
        restoreJob(toActiveJob(booking));
      })
      .catch((err) => {
        if (mounted) setJobError(err.message || "Unable to load this assigned job.");
      })
      .finally(() => {
        if (mounted) setJobLoading(false);
      });
    return () => { mounted = false; };
  }, [jobId, restoreJob]);
  const checklist = useServiceChecklist(activeJob, serviceStarted, setError);
  const actions = useWasherServiceActions({
    activeJob,
    beforePhotos,
    afterPhotos,
    allTasksCompleted: checklist.allTasksCompleted,
    loading,
    validating,
    setError,
    setLoading,
    setValidating,
    setStage,
    markBeforePhotosAdded: context.markBeforePhotosAdded,
    startService: context.startService,
    markAfterPhotosAdded: context.markAfterPhotosAdded,
    completeService: context.completeService,
    updateJobStatus: context.updateJobStatus,
  });

  if (jobLoading) {
    return <main className="flex min-h-[60vh] items-center justify-center p-6"><p role="status" className="text-sm text-slate-600">Loading assigned service...</p></main>;
  }

  if (jobError) {
    return <main className="mx-auto max-w-xl p-6"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{jobError}</div><button type="button" onClick={() => navigate("/washer/jobs")} className="mt-4 font-semibold text-green-800 underline">Back to my jobs</button></main>;
  }

  if (!activeJob || activeJob.databaseId !== jobId) {
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
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}
        <WasherServiceStages
          stage={stage}
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
