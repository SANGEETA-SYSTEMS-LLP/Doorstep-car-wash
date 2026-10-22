import { CheckCircle2, Phone, Play } from "lucide-react";
import PhotoStage from "./PhotoStage";
import ServiceChecklist from "./ServiceChecklist";
import CompletedService from "./CompletedService";

function WasherServiceStages({
  stage, loading, beforePhotos, afterPhotos,
  checklist, checklistLoading, savingTask, retryChecklist, activeJob,
  allTasksCompleted, toggleTask, moveToAfterPhotos,
  onBeforePhotos, onStartService, onAfterPhotos, onCompleteJob,
  jobStatus, validating, onValidate, onDashboard,
}) {
  return (
    <>
      {stage === "before" && (
        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Washer arrived · Contact customer</p>
            <p className="mt-2 font-semibold text-slate-900">{activeJob?.customer?.name || "Customer"}</p>
            {activeJob?.customer?.phone ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <a href={`tel:${String(activeJob.customer.phone).replace(/[^+0-9]/g, "")}`} className="text-lg font-semibold text-slate-800">{activeJob.customer.phone}</a>
                <a href={`tel:${String(activeJob.customer.phone).replace(/[^+0-9]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"><Phone size={18} />Call customer</a>
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
        </div>
      )}
      {stage === "service" && (
        <ServiceChecklist
          checklist={checklist}
          loading={checklistLoading}
          saving={savingTask}
          retry={retryChecklist}
          activeJob={activeJob}
          toggleTask={toggleTask}
          allTasksCompleted={allTasksCompleted}
          moveToAfterPhotos={moveToAfterPhotos}
        />
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

export default WasherServiceStages;
