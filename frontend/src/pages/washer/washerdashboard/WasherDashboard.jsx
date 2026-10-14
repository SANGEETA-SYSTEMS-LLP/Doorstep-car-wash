import { currentPosition } from "../../../services/maps";
import { sendWasherLocation } from "../../../services/washerJobService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Power, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useWasher } from "../../../context/WasherContext";
import useWasherWorkspace from "../../../hooks/useWasherWorkspace";
import { ACTIVE_STATUSES, getWasherJob, setWasherAvailability, toActiveJob } from "../../../services/washerWorkspaceService";
import { acceptAssignment, rejectAssignment } from "../../../services/assignmentService";
import WasherBookingCard from "../../../components/washer/WasherBookingCard";

export default function WasherDashboard() {
  const { profile } = useAuth();
  const { acceptJob, updateJobStatus, setOnline } = useWasher();
  const { data, loading, error, refresh } = useWasherWorkspace();
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();
  const online = data?.washer?.status === "available";
  const active = (data?.jobs || []).filter(job => ACTIVE_STATUSES.includes(job.status));
  useEffect(() => {
    if (!online || !navigator.geolocation) return;
    let active = true;
    let lastSent = 0;
    const watch = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (Date.now() - lastSent < 10000) return;
      lastSent = Date.now();
      try { await sendWasherLocation(coords.toJSON ? coords.toJSON() : { latitude: coords.latitude, longitude: coords.longitude, heading: coords.heading, speed: coords.speed }); }
      catch (err) { if (active) setActionError(err.message); }
    }, () => { if (active) setActionError("Allow location access to receive nearby requests."); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => { active = false; navigator.geolocation.clearWatch(watch); };
  }, [online]);
  async function respond(offer, accepted) {
    if (busy) return;
    setBusy(offer.id); setActionError("");
    try {
      if (accepted) {
        await acceptAssignment(offer.id);
        const { booking } = await getWasherJob(offer.booking_id);
        acceptJob(toActiveJob(booking)); updateJobStatus(booking.status);
        navigate("/washer/jobs/" + booking.id);
      } else { await rejectAssignment(offer.id); }
    } catch (err) { setActionError(err.message); }
    finally { setBusy(""); refresh(); }
  }
  async function toggle() {
    if (busy) return;
    setBusy("availability"); setActionError("");
    try {
      if (!online) {
        const point = await currentPosition();
        await sendWasherLocation({ latitude: point.lat, longitude: point.lng });
      }
      await setWasherAvailability(!online); setOnline(!online);
    }
    catch (err) { setActionError(err.message); }
    finally { setBusy(""); refresh(); }
  }
  return <main className="mx-auto max-w-6xl space-y-7 p-5 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-semibold text-blue-600">WASHER PARTNER</p><h1 className="mt-2 text-3xl font-bold">Hello, {profile?.full_name || "partner"}</h1><p className="mt-2 break-all text-xs text-slate-500">Washer ID: {data?.washer?.referenceId || "Loading..."}</p></div><div className="flex gap-2"><button onClick={refresh} className="rounded-xl border border-slate-200 p-3" aria-label="Refresh jobs"><RefreshCw size={20} /></button><button disabled={!data || Boolean(busy) || active.length > 0} onClick={toggle} className={"flex items-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:opacity-50 " + (online ? "bg-green-600 text-white" : "bg-slate-200 text-slate-800")}><Power size={18} />{active.length ? "On a job" : online ? "Online" : "Go online"}</button></div></header>
    {(error || actionError) && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{actionError || error}</p>}
    {loading && <p role="status">Loading your bookings...</p>}
    {data && <div className="grid gap-4 sm:grid-cols-3">{[["Incoming requests", data.assignments.length], ["Active bookings", active.length], ["Completed jobs", data.washer.jobs_completed || 0]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>}
    {active.length > 0 && <section><h2 className="mb-4 text-xl font-bold">Your active bookings</h2><div className="grid gap-5 lg:grid-cols-2">{active.map(job => <WasherBookingCard key={job.id} booking={job} />)}</div></section>}
    <section><h2 className="mb-2 text-xl font-bold">Incoming requests</h2><p className="mb-4 text-sm text-slate-500">Requests update automatically. Review the customer and vehicle details before accepting.</p><div className="grid gap-5 lg:grid-cols-2">{data?.assignments.map(offer => <WasherBookingCard key={offer.id} booking={offer.booking} assignment={offer} busy={Boolean(busy)} onAccept={() => respond(offer, true)} onReject={() => respond(offer, false)} />)}</div>{!loading && data && !data.assignments.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{online ? "Waiting for eligible bookings near you." : "Go online to receive booking requests."}</p>}</section>
  </main>;
}
