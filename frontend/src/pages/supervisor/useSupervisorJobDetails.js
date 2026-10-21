import { useCallback, useEffect, useState } from "react";
import {
  assignWasherToBooking,
  getSupervisorJobDetails,
  validateSupervisorService,
} from "../../services/supervisorService";
import { supabase } from "../../services/supabase";

function useSupervisorJobDetails(bookingId) {
  const [job, setJob] = useState(null);
  const [address, setAddress] = useState(null);
  const [washers, setWashers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validating, setValidating] = useState(false);

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSupervisorJobDetails(bookingId);
      setJob(response.booking);
      setAddress(response.address);
      setWashers(response.availableWashers || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load booking details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadJob();
    const channel = supabase
      .channel(`supervisor-booking-${bookingId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "bookings",
        filter: `id=eq.${bookingId}`,
      }, loadJob)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("Live booking updates are unavailable. Refresh to check the latest status.");
        }
      });
    return () => supabase.removeChannel(channel);
  }, [bookingId, loadJob]);

  const handleAssign = async (washerId) => {
    if (!window.confirm("Send this booking offer to the selected washer?")) return;
    setAssigningId(washerId);
    setError("");
    setSuccess("");
    try {
      await assignWasherToBooking(bookingId, washerId);
      setSuccess("Offer sent. Waiting for the washer to accept.");
      await loadJob();
    } catch (assignError) {
      setError(assignError.message || "Failed to assign washer.");
    } finally {
      setAssigningId("");
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setError("");
    setSuccess("");
    try {
      await validateSupervisorService(bookingId);
      setJob((current) => ({ ...current, status: "completed" }));
      setSuccess("Service validated. Booking is now complete.");
    } catch (validationError) {
      setError(validationError.message || "Failed to validate service.");
    } finally {
      setValidating(false);
    }
  };

  return {
    job, address, washers, loading, assigningId, error, success, validating,
    loadJob, handleAssign, handleValidate,
  };
}

export default useSupervisorJobDetails;
