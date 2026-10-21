import { useCallback, useEffect, useState } from "react";
import {
  assignWasherToBooking,
  getSupervisorJobDetails,
} from "../../../services/supervisor/supervisorService";

function useEscalationDetails(bookingId) {
  const [booking, setBooking] = useState(null);
  const [address, setAddress] = useState(null);
  const [washers, setWashers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSupervisorJobDetails(bookingId);
      setBooking(response.booking);
      setAddress(response.address);
      setWashers(response.availableWashers || []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load escalation.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleAssign = async (washerId) => {
    const confirmed = window.confirm(
      "Assign this washer to the booking and resolve the assignment escalation?"
    );
    if (!confirmed) return;

    setAssigningId(washerId);
    setError("");
    setSuccess("");
    try {
      await assignWasherToBooking(bookingId, washerId);
      setSuccess("Washer assigned successfully. Escalation resolved.");
      await loadDetails();
    } catch (assignError) {
      setError(assignError.message || "Unable to assign the washer.");
    } finally {
      setAssigningId("");
    }
  };

  return {
    booking,
    address,
    washers,
    loading,
    assigningId,
    error,
    success,
    loadDetails,
    handleAssign,
  };
}

export default useEscalationDetails;
