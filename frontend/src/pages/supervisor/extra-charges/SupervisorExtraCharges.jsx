import ExtraChargeRequestList from "./ExtraChargeRequestList";
import ExtraChargePageHeader from "./ExtraChargePageHeader";
import ExtraChargeError from "./ExtraChargeError";
import useSupervisorExtraCharges from "./useSupervisorExtraCharges";

export default function SupervisorExtraCharges() {
  const { requests, processingId, error, handleReview } = useSupervisorExtraCharges();
  return (
    <div>
      <ExtraChargePageHeader />
      <ExtraChargeError message={error} />
      <ExtraChargeRequestList
        requests={requests}
        processingId={processingId}
        onReview={handleReview}
      />
    </div>
  );
}
