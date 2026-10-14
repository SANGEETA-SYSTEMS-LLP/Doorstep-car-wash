import {
  completeBookingService,
  startBookingService,
  validateWasherService,
  verifyWasherOtp,
} from "../../../services/washerJobService";
import { uploadServicePhotos } from "../../../services/servicePhotoService";

function useWasherServiceActions({
  activeJob,
  otp,
  beforePhotos,
  afterPhotos,
  allTasksCompleted,
  loading,
  validating,
  setError,
  setLoading,
  setValidating,
  setStage,
  verifyOtp,
  markBeforePhotosAdded,
  startService,
  markAfterPhotosAdded,
  completeService,
  updateJobStatus,
}) {
  const handleVerifyOtp = async () => {
    if (!activeJob?.databaseId) return setError("Booking details are unavailable.");
    if (otp.length !== 6) return setError("Enter the 6-digit customer OTP.");
    try {
      setError("");
      await verifyWasherOtp(activeJob.databaseId, otp);
      verifyOtp();
      setStage("before");
    } catch (error) {
      console.error(error);
      setError(error.message || "Incorrect OTP.");
    }
  };

  const handleStartService = async () => {
    if (!activeJob?.databaseId || loading) return;
    if (!beforePhotos.length) return setError("Add at least one before-service photo.");
    try {
      setError("");
      setLoading(true);
      await uploadServicePhotos({ bookingId: activeJob.databaseId, type: "before", files: beforePhotos });
      markBeforePhotosAdded();
      await startBookingService(activeJob.databaseId);
      startService();
      setStage("service");
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to start service.");
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async () => {
    if (!activeJob?.databaseId || loading) return;
    if (!allTasksCompleted) {
      return setError("Complete all checklist tasks before uploading after-service photos.");
    }
    if (!afterPhotos.length) return setError("Add at least one after-service photo.");
    try {
      setError("");
      setLoading(true);
      await uploadServicePhotos({ bookingId: activeJob.databaseId, type: "after", files: afterPhotos });
      markAfterPhotosAdded();
      await completeBookingService(activeJob.databaseId);
      completeService();
      setStage("completed");
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to complete service.");
    } finally {
      setLoading(false);
    }
  };

  const validateJob = async () => {
    if (!activeJob?.databaseId || validating) return;
    try {
      setError("");
      setValidating(true);
      await validateWasherService(activeJob.databaseId);
      updateJobStatus("completed");
    } catch (error) {
      setError(error.message || "Unable to validate service completion.");
    } finally {
      setValidating(false);
    }
  };

  return { handleVerifyOtp, handleStartService, completeJob, validateJob };
}

export default useWasherServiceActions;
