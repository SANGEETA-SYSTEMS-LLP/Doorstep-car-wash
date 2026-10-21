import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWasher } from "../../../context/WasherContext";
import { getWasherJob, toActiveJob } from "../../../services/washer/washerWorkspaceService";
import { startWasherJourney } from "../../../services/washer/washerJobService";
import WasherJobDetailsContent from "./WasherJobDetailsContent";

export default function WasherJobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { restoreJob } = useWasher();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    let active = true;
    getWasherJob(jobId).then(result => { if (active) { setBooking(result.booking); restoreJob(toActiveJob(result.booking)); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [jobId, restoreJob]);
  async function start() {
    if (starting || booking?.status !== "washer_assigned") return;
    setStarting(true); setError("");
    try {
      await startWasherJourney(booking.id);
      restoreJob(toActiveJob({ ...booking, status: "washer_on_the_way" }));
      navigate("/washer/jobs/" + booking.id + "/navigation");
    } catch (err) { setError(err.message); }
    finally { setStarting(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-5 p-5 lg:p-8"><Link to="/washer/jobs" className="text-sm text-blue-700 underline">Back to my bookings</Link><h1 className="text-3xl font-bold">Booking details</h1>{loading && <p role="status">Loading booking...</p>}{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{booking && booking.id === jobId && <WasherJobDetailsContent booking={booking} onStart={start} starting={starting} />}</main>;
}
