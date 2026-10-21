import { useEffect, useState } from "react";
import { getServiceChecklist, updateServiceChecklist } from "../../../services/booking/checklistService";

function useServiceChecklist(activeJob, serviceStarted, setError) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!activeJob?.databaseId || !serviceStarted) return undefined;
    let cancelled = false;
    setLoading(true);
    getServiceChecklist(activeJob.databaseId)
      .then((data) => { if (!cancelled) setChecklist(data.checklist || []); })
      .catch((error) => { if (!cancelled) setError(error.message || "Unable to load checklist."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeJob?.databaseId, serviceStarted, retry, setError]);

  const toggleTask = async (task) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const data = await updateServiceChecklist(activeJob.databaseId, task.id, !task.completed);
      setChecklist((items) => items.map((item) => item.id === task.id
        ? { ...item, ...data.checklistItem }
        : item));
    } catch (error) {
      setError(error.message || "Unable to save checklist item.");
    } finally {
      setSaving(false);
    }
  };

  return {
    checklist,
    loading,
    saving,
    retry: () => setRetry((value) => value + 1),
    toggleTask,
    allTasksCompleted: !loading && !saving && checklist.length > 0 &&
      checklist.every((item) => item.completed),
  };
}

export default useServiceChecklist;
