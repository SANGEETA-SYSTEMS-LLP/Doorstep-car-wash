import { CheckCircle2, Play } from "lucide-react";
import OtpVerification from "./OtpVerification";
import PhotoStage from "./PhotoStage";
import ServiceChecklist from "./ServiceChecklist";
import CompletedService from "./CompletedService";

function WasherServiceStages({
  stage, otp, setOtp, error, otpReady, loading, beforePhotos, afterPhotos,
  checklist, checklistLoading, savingTask, retryChecklist, activeJob,
  allTasksCompleted, toggleTask, moveToAfterPhotos, onVerifyOtp,
  onBeforePhotos, onStartService, onAfterPhotos, onCompleteJob,
  jobStatus, validating, onValidate, onDashboard,
}) {
  return (
    <>
      {stage === "otp" && <OtpVerification otp={otp} setOtp={setOtp} verifyOtp={onVerifyOtp} error={error} otpReady={otpReady} />}
      {stage === "before" && (
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
