import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../services/auth/supabase";
import {
  getSupervisorExtraCharges,
  reviewSupervisorExtraCharge,
} from "../../../services/supervisor/supervisorService";

function useSupervisorExtraCharges() {
  const [requests, setRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      const data = await getSupervisorExtraCharges();
      setRequests(data.requests || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const channel = supabase
      .channel("supervisor-extra-charges")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "extra_charge_requests",
      }, loadRequests)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "extra_charge_requests",
      }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadRequests]);

  const handleReview = async (requestId, action) => {
    try {
      setProcessingId(requestId);
      setError("");
      await reviewSupervisorExtraCharge(requestId, action);
      setRequests((previous) => previous.filter((item) => item.id !== requestId));
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setProcessingId(null);
    }
  };

  return { requests, processingId, error, handleReview };
}

export default useSupervisorExtraCharges;
