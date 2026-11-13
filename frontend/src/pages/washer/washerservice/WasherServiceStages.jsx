import { CheckCircle2, Phone, Play, TriangleAlert } from "lucide-react";
import PhotoStage from "./PhotoStage";
import ServiceChecklist from "./ServiceChecklist";
import CompletedService from "./CompletedService";

function WasherServiceStages({
  stage, loading, beforePhotos, afterPhotos,
  checklist, checklistLoading, savingTask, retryChecklist, activeJob,
  allTasksCompleted, toggleTask, moveToAfterPhotos,
  onBeforePhotos, onStartService, onAfterPhotos, onCompleteJob,
  jobStatus, validating, onValidate, onDashboard, canReportFailure, failureReason, setFailureReason, onReportFailure, reportingFailure,
}) {
  return (
    <>
      {stage === "before" && (
        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">Washer arrived · Contact customer</p>
            <p className="mt-2 font-semibold text-slate-900">{activeJob?.customer?.name || "Customer"}</p>
            {activeJob?.customer?.phone ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <a href={`tel:${String(activeJob.customer.phone).replace(/[^+0-9]/g, "")}`} className="text-lg font-semibold text-slate-800">{activeJob.customer.phone}</a>
                <a href={`tel:${String(activeJob.customer.phone).replace(/[^+0-9]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"><Phone size={18} />Call customer</a>
              </div>
            ) : <p className="mt-2 text-sm text-slate-600">Customer phone number is unavailable.</p>}
          </section>
          <PhotoStage
            title="Before Service Photos"
            description="Take clear photos of the vehicle before starting the service."
            photos={beforePhotos}
            onChange={onBeforePhotos}
            buttonText={loading ? "Starting Service..." : "Start Service"}
            buttonIcon={<Play size={18} />}
            disabled={loading || !beforePhotos.length}
            onContinue={onStartService}
          />
          {canReportFailure && <ServiceFailureForm failureReason={failureReason} setFailureReason={setFailureReason} onReportFailure={onReportFailure} reportingFailure={reportingFailure} />}
        </div>
      )}
      {stage === "service" && (
        <div className="space-y-4"><ServiceChecklist
          checklist={checklist}
          loading={checklistLoading}
          saving={savingTask}
          retry={retryChecklist}
          activeJob={activeJob}
          toggleTask={toggleTask}
          allTasksCompleted={allTasksCompleted}
          moveToAfterPhotos={moveToAfterPhotos}
        />{canReportFailure && <ServiceFailureForm failureReason={failureReason} setFailureReason={setFailureReason} onReportFailure={onReportFailure} reportingFailure={reportingFailure} />}</div>
      )}
      {stage === "after" && (
        <PhotoStage
          title="After Service Photos"
          description="Upload final photos showing the completed car wash."
          photos={afterPhotos}
          onChange={onAfterPhotos}
          buttonText={loading ? "Uploading Photos..." : "Complete Job"}
          buttonIcon={<CheckCircle2 size={18} />}
          disabled={loading || !afterPhotos.length}
          onContinue={onCompleteJob}
        />
      )}
      {stage === "completed" && (
        <CompletedService
          jobStatus={jobStatus}
          validating={validating}
          onValidate={onValidate}
          onDashboard={onDashboard}
        />
      )}
    </>
  );
}

function ServiceFailureForm({ failureReason, setFailureReason, onReportFailure, reportingFailure }) {
  return <form onSubmit={onReportFailure} className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div className="flex items-start gap-3"><TriangleAlert size={20} className="mt-0.5 text-amber-700" /><div className="flex-1"><h2 className="font-bold text-amber-950">Service cannot be completed?</h2><p className="mt-1 text-sm text-amber-900">Tell Accounts why. They will review the paid booking and process a customer refund if approved.</p>
      <textarea required minLength={5} maxLength={1000} value={failureReason} onChange={event => setFailureReason(event.target.value)} rows={3} className="mt-3 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm" placeholder="Describe the issue preventing the wash" />
      <button disabled={reportingFailure || failureReason.trim().length < 5} className="mt-3 rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{reportingFailure ? "Sending report…" : "Report incomplete service"}</button>
    </div></div>
  </form>;
}

export default WasherServiceStages;
