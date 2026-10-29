import { getWasherJob, toActiveJob } from "../../../services/washer/washerWorkspaceService";
import { useEffect, useRef, useState } from "react";
import { sendWasherLocation, markWasherArrived } from "../../../services/washer/washerJobService";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "lucide-react";
import { useWasher } from "../../../context/WasherContext";
import WasherNavigationContent from "./WasherNavigationContent";

function WasherNavigation() {
  const { washerState, updateJobStatus, restoreJob } = useWasher();
  const { activeJob } = washerState;
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [locationError, setLocationError] = useState("");
  const lastSentRef = useRef(0);
  const [loadedJobId, setLoadedJobId] = useState(null);
  const [jobError, setJobError] = useState("");
  useEffect(() => {
    let active = true;
    getWasherJob(jobId).then(({ booking }) => {
      if (active) { restoreJob(toActiveJob(booking)); setLoadedJobId(jobId); setJobError(""); }
    }).catch(err => { if (active) setJobError(err.message); });
    return () => { active = false; };
  }, [jobId, restoreJob]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (!activeJob?.databaseId || loadedJobId !== jobId) return;
    if (!navigator.geolocation) {
      setLocationError("Location services are not supported by this browser.");
      return;
    }

    let cancelled = false;
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (cancelled) return;
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: position.timestamp,
        });
        const now = Date.now();
        if (now - lastSentRef.current < 5000) return;
        lastSentRef.current = now;

        const { latitude, longitude, heading, accuracy, speed } = position.coords;
        try {
          await sendWasherLocation({ latitude, longitude, heading, accuracy, speed });
          if (!cancelled) setLocationError("");
        } catch (error) {
          console.error("Location update:", error);
          if (!cancelled) setLocationError("Unable to send your location. Please check your connection.");
        }
      },
      (error) => {
        if (cancelled) return;
        console.error(error);
        setLocationError("Please allow location access to continue navigation.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeJob?.databaseId, loadedJobId, jobId]);

  const handleArrived = async () => {
    const bookingId = washerState.activeJob?.databaseId;
    if (!bookingId) return;

    try {
      // Persist the arrived status before opening the service checklist.
      await markWasherArrived(bookingId);
      updateJobStatus("washer_arrived");
      navigate(`/washer/jobs/${bookingId}/service`);
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to mark arrival.");
    }
  };

  if (loadedJobId !== jobId) {
    return <div className="p-8"><p role={jobError ? "alert" : "status"}>{jobError || "Loading assigned booking..."}</p><button onClick={() => navigate("/washer/jobs")} className="mt-4 text-green-700 underline">Back to bookings</button></div>;
  }

  if (!activeJob) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <Navigation size={40} className="mx-auto text-slate-300" />
          <h2 className="mt-4 text-xl font-bold">No Active Job</h2>
          <p className="mt-2 text-sm text-slate-500">
            Accept a customer booking before starting navigation.
          </p>
          <button
            onClick={() => navigate("/washer")}
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {locationError && (
        <div role="alert" className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {locationError}
        </div>
      )}
      <WasherNavigationContent currentLocation={currentLocation} activeJob={activeJob} navigate={navigate} jobId={jobId} handleArrived={handleArrived} />
    </>
  );
}

export default WasherNavigation;
