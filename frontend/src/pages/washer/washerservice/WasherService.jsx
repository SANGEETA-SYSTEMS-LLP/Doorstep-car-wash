import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWasher } from "../../../context/WasherContext";
import useServiceChecklist from "./useServiceChecklist";
import useWasherServiceActions from "./useWasherServiceActions";
import WasherServiceHeader from "./WasherServiceHeader";
import WasherServiceStages from "./WasherServiceStages";
import NoActiveService from "./NoActiveService";
import { getWasherJob, toActiveJob } from "../../../services/washer/washerWorkspaceService";
import { apiRequest } from "../../../api/apiClient";

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
  const [failureReason, setFailureReason] = useState("");
  const [reportingFailure, setReportingFailure] = useState(false);
  const [clockTime, setClockTime] = useState(null);
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
  useEffect(() => {
    const timer = window.setInterval(() => setClockTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
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

  const reportFailure = async event => {
    event.preventDefault();
    if (reportingFailure) return;
    setReportingFailure(true);
    setError("");
    try {
      await apiRequest(`/washer/bookings/${jobId}/service-failure`, { method: "POST", body: JSON.stringify({ reason: failureReason.trim() }) });
      setError("Service issue sent to Accounts. The paid booking is now awaiting refund review.");
      setFailureReason("");
    } catch (reportError) { setError(reportError.message || "Unable to send the service issue report."); }
    finally { setReportingFailure(false); }
  };

  const scheduledStart = activeJob?.scheduled_date && activeJob?.scheduled_start_time
    ? Date.parse(`${activeJob.scheduled_date}T${String(activeJob.scheduled_start_time).slice(0, 8)}+05:30`)
    : NaN;
  const serviceDeadlinePassed = Number.isFinite(scheduledStart)
    && clockTime != null
    && clockTime >= scheduledStart + (Number(activeJob?.package?.duration_minutes) || 60) * 60_000 + 30 * 60_000;
  const canReportFailure = serviceDeadlinePassed
    && !activeJob?.service_validated_at
    && ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(activeJob?.status)
    && ["paid", "captured", "success", "completed"].includes(String(activeJob?.payment?.status || "").toLowerCase());

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
          canReportFailure={canReportFailure}
          failureReason={failureReason}
          setFailureReason={setFailureReason}
          onReportFailure={reportFailure}
          reportingFailure={reportingFailure}
        />
      </main>
    </div>
  );
}

export default WasherService;
