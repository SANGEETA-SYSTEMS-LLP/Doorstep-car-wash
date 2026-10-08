import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "lucide-react";
import { useWasher } from "../../../context/WasherContext";
import WasherNavigationContent from "./WasherNavigationContent";

function WasherNavigation() {
  const { washerState, updateJobStatus } = useWasher();
  const { activeJob } = washerState;
  const navigate = useNavigate();
  const { jobId } = useParams();

  useEffect(() => {
    if (activeJob && washerState.jobStatus === "accepted") {
      updateJobStatus("on_the_way");
    }
  }, []);

  const handleArrived = () => {
    updateJobStatus("arrived");

    navigate(`/washer/jobs/${jobId}/service`);
  };

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
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <WasherNavigationContent activeJob={activeJob} navigate={navigate} jobId={jobId} handleArrived={handleArrived} />
  );
}

export default WasherNavigation;
