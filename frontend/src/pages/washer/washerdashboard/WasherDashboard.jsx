import { currentPosition } from "../../../services/locations/maps";
import { sendWasherLocation } from "../../../services/washer/washerJobService";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Banknote, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Power, RefreshCw } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useWasher } from "../../../context/WasherContext";
import useApi from "../../../hooks/useApi";
import useWasherWorkspace from "../../../hooks/useWasherWorkspace";
import { ACTIVE_STATUSES, getWasherJob, setWasherAvailability, toActiveJob } from "../../../services/washer/washerWorkspaceService";
import { acceptAssignment, rejectAssignment } from "../../../services/booking/assignmentService";
import WasherBookingCard from "../../../components/washer/WasherBookingCard";

const inProgressStatuses = ["washer_on_the_way", "washer_arrived", "otp_verified", "service_started"];
const closedStatuses = ["completed", "customer_confirmed", "payment_completed", "closed"];

function localDayRange(now) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return { dateKey, from: start.toISOString(), to: end.toISOString() };
}

function MetricCard({ icon: Icon, label, value, detail, tone = "green" }) {
  const colors = tone === "green"
    ? "bg-green-50 text-green-700"
    : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-green-50 text-green-700";
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-slate-950">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-xl p-3 ${colors}`}><Icon size={20} strokeWidth={1.8} /></span>
      </div>
    </article>
  );
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function WasherDashboard() {
  const { profile, user, logout } = useAuth();
  const { acceptJob, updateJobStatus, setOnline } = useWasher();
  const { data, loading, error, refresh, accountUnavailable, errorStatus } = useWasherWorkspace();
  const [dashboardNow, setDashboardNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setDashboardNow(() => new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const { dateKey, from, to } = localDayRange(dashboardNow);
  const earningsUrl = `/account/earnings/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const earnings = useApi(earningsUrl);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();
  const online = data?.washer?.status === "available";
  const jobs = data?.jobs || [];
  const locationTracking = online || jobs.some(job => ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(job.status));
  const active = jobs.filter(job => ACTIVE_STATUSES.includes(job.status));
  const todayJobs = jobs.filter(job => job.scheduled_date === dateKey);
  const pendingCount = jobs.filter(job => job.status === "washer_assigned").length;
  const inProgressCount = jobs.filter(job => inProgressStatuses.includes(job.status)).length;
  const summaryAvailable = Boolean(data);
  const nextJobs = jobs
    .filter(job => !closedStatuses.includes(job.status))
    .sort((first, second) => {
      const firstSchedule = `${first.scheduled_date || "9999-99-99"}T${first.scheduled_start_time || "99:99"}`;
      const secondSchedule = `${second.scheduled_date || "9999-99-99"}T${second.scheduled_start_time || "99:99"}`;
      return firstSchedule.localeCompare(secondSchedule);
    })
    .slice(0, 3);

  useEffect(() => {
    if (!locationTracking || !navigator.geolocation) return;
    let activeWatch = true;
    let lastSent = 0;
    let sending = false;
    const sendPosition = async (coords) => {
      if (!activeWatch || sending || Date.now() - lastSent < 10000) return;
      lastSent = Date.now();
      sending = true;
      try { await sendWasherLocation(coords.toJSON ? coords.toJSON() : { latitude: coords.latitude, longitude: coords.longitude, heading: coords.heading, speed: coords.speed }); }
      catch (err) { if (activeWatch) setActionError(err.message); }
      finally { sending = false; }
    };
    const watch = navigator.geolocation.watchPosition(({ coords }) => { void sendPosition(coords); }, () => {
      if (activeWatch) setActionError("Allow location access to receive nearby requests.");
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    const heartbeat = setInterval(() => {
      if (!activeWatch || sending) return;
      navigator.geolocation.getCurrentPosition(({ coords }) => { void sendPosition(coords); }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    }, 60000);
    return () => { activeWatch = false; clearInterval(heartbeat); navigator.geolocation.clearWatch(watch); };
  }, [locationTracking]);

  async function respond(offer, accepted) {
    if (busy) return;
    setBusy(offer.id);
    setActionError("");
    try {
      if (accepted) {
        await acceptAssignment(offer.id);
        const { booking } = await getWasherJob(offer.booking_id);
        acceptJob(toActiveJob(booking));
        updateJobStatus(booking.status);
        navigate("/washer/jobs/" + booking.id);
      } else {
        await rejectAssignment(offer.id);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy("");
      refresh();
    }
  }

  async function toggle() {
    if (busy) return;
    setBusy("availability");
    setActionError("");
    try {
      if (!online) {
        const point = await currentPosition();
        await sendWasherLocation({ latitude: point.lat, longitude: point.lng });
      }
      await setWasherAvailability(!online);
      setOnline(!online);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy("");
      refresh();
    }
  }

  if (accountUnavailable) return <main className="mx-auto max-w-3xl p-5 lg:p-8">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-green-900 p-8 text-white sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-200">Washer partner workspace</p>
        <h1 className="mt-3 text-3xl font-bold">Let’s get your account ready</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">Your workday starts when your washer profile is linked and activated by your administrator.</p>
      </div>
      <div className="p-8">
      <p className="text-slate-600">This account does not have an active washer profile. Contact support to check your washer account.</p>
      <p className="mt-4 text-slate-600">Ask your administrator to link and activate the washer profile for <strong>{user?.email || "your signed-in account"}</strong>. If you already have a washer account, sign in with that account.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={refresh} className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white">Check activation again</button>
        <button onClick={async () => { try { await logout(); navigate("/login"); } catch (err) { setActionError(err.message); } }} className="rounded-xl border px-5 py-3">Sign in with another account</button>
        <Link to="/" className="px-5 py-3 text-green-700">Back to home</Link>
      </div>
      {actionError && <p role="alert" className="mt-4 text-red-700">{actionError}</p>}
      </div>
    </section>
  </main>;

  const displayDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(dashboardNow);
  const dailyEarnings = earnings.loading || earnings.error || !earnings.data ? "-" : formatCurrency(earnings.data.earned);

  return <main className="mx-auto max-w-7xl space-y-8 p-5 lg:p-8">
    <section className="overflow-hidden border-y border-slate-300 bg-green-900 p-6 text-white sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">Washer partner workspace</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Good day, {profile?.full_name?.trim().split(/\s+/)[0] || "partner"}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-green-100 sm:text-base">Here’s your workday at a glance. Your next job, customer details, and service progress are all in one place.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-green-100">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5"><CalendarDays size={14} />{displayDate}</span>
          </div>
          <div className="mt-4 inline-flex max-w-full flex-col gap-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-200">Washer ID</span>
            <span className="break-all font-mono text-sm font-bold tracking-wide text-white sm:text-base">{data?.washer?.referenceId || (loading ? "Loading..." : "Unavailable")}</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <button onClick={() => { refresh(); earnings.refresh(); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15" aria-label="Refresh dashboard"><RefreshCw size={17} className={loading ? "animate-spin" : ""} />Refresh</button>
          <button disabled={!data || (!online && (!data.washer.is_verified || !data.payoutAccountConfigured)) || Boolean(busy) || active.length > 0} onClick={toggle} className={"inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 " + (online ? "bg-green-500 text-white hover:bg-green-400" : "bg-white text-slate-900 hover:bg-green-50")}><Power size={17} />{busy === "availability" ? "Updating..." : active.length ? "On a job" : online ? "Online · Go offline" : "Go online"}</button>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5 text-sm">
        <span className={"h-2.5 w-2.5 rounded-full ring-2 ring-white/20 " + (online ? "bg-green-300" : "bg-slate-400")} />
        <span className="font-semibold">{online ? "You’re online and ready for work" : active.length ? "You’re focused on an active job" : "You’re currently offline"}</span>
        {!data?.washer?.is_verified && data && <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">Verification required to go online</span>}
      </div>
    </section>

    {data && !data.washer.is_verified && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div><p className="font-semibold">Your washer account is waiting for supervisor verification.</p><p className="mt-1">Sign in with the supervisor account and open Washer verification. Once approved, return here to go online and receive eligible jobs.</p></div><button type="button" onClick={async () => { try { await logout(); navigate("/login", { replace: true }); } catch (err) { setActionError(err.message || "Unable to switch accounts."); } }} className="shrink-0 rounded-lg border border-amber-300 bg-white px-4 py-2 font-semibold text-amber-950 hover:bg-amber-100">Switch to supervisor account</button></div>}
    {data && !data.payoutAccountConfigured && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><div><p className="font-semibold">Add payout details to receive job assignments.</p><p className="mt-1">Open your profile and save your bank account or UPI details. Once your account is supervisor-verified, return here and go online.</p></div><Link to="/washer/profile" className="shrink-0 rounded-lg border border-green-300 bg-white px-4 py-2 font-semibold text-green-900 hover:bg-green-100">Add payout details</Link></div>}
    {(error || actionError) && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><div><p className="font-semibold">{actionError || error}</p>{errorStatus === 403 && <p className="mt-1">Washer access requires the washer role and an active washer profile. Ask your supervisor to confirm this account; supervisor verification is required to go online.</p>}{errorStatus >= 500 && <p className="mt-1">The washer service could not retrieve your workspace. Please retry; if this continues, contact support.</p>}</div><button type="button" onClick={refresh} disabled={loading} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50">Retry jobs</button></div>}
    {earnings.error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{earnings.errorStatus === 404 ? "Earnings service route not found. Restart the backend service and try again." : `Today's earnings could not be loaded: ${earnings.error}`}</p><button type="button" onClick={earnings.refresh} disabled={earnings.loading} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">Retry earnings</button></div>}
    {loading && <p role="status" className="text-sm text-slate-500">Loading your work summary...</p>}

    <section aria-label="Daily work summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={CalendarDays} label="Today's jobs" value={loading || !summaryAvailable ? "-" : todayJobs.length} detail="Scheduled for today" />
      <MetricCard icon={Clock3} label="Pending jobs" value={loading || !summaryAvailable ? "-" : pendingCount} detail="Assigned, ready for travel" tone="amber" />
      <MetricCard icon={BriefcaseBusiness} label="In progress" value={loading || !summaryAvailable ? "-" : inProgressCount} detail="On the way or washing" tone="green" />
      <MetricCard icon={CheckCircle2} label="Completed jobs" value={loading || !summaryAvailable ? "-" : data?.washer?.jobs_completed || 0} detail="Your completed total" tone="green" />
      <MetricCard icon={Banknote} label="Today's earnings" value={dailyEarnings} detail={earnings.data ? `${formatCurrency(earnings.data.pending)} pending · ${formatCurrency(earnings.data.settled)} paid` : "Pending and paid totals"} tone="green" />
    </section>

    <section className="grid items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Your workday</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Upcoming jobs</h2></div>
          <Link to="/washer/jobs" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50">View all jobs <ArrowRight size={16} /></Link>
        </div>
        {loading && !jobs.length ? <div role="status" className="grid gap-4"><span className="sr-only">Loading upcoming jobs</span>{[0, 1].map(item => <div key={item} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div> : !data && error ? null : nextJobs.length > 0 ? <div className="grid gap-4">{nextJobs.map(job => <WasherBookingCard key={job.id} booking={job} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700"><BriefcaseBusiness /></span><h3 className="mt-3 font-semibold text-slate-900">{loading ? "Finding your jobs..." : "No upcoming jobs yet"}</h3><p className="mt-1 text-sm text-slate-500">New assigned jobs and their next steps will appear here.</p><Link to="/washer/jobs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:underline">View your job history <ArrowRight size={15} /></Link></div>}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Available work</p><h2 className="mt-1 text-xl font-bold text-slate-950">Incoming requests</h2></div>
          <span className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold " + (online ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600")}><span className={"h-1.5 w-1.5 rounded-full " + (online ? "bg-green-600" : "bg-slate-400")} />{online ? "Online" : "Offline"}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Review the customer, vehicle, and schedule before accepting an offer.</p>
        {data?.assignments?.length ? <div className="mt-4 space-y-4">{data.assignments.map(offer => <WasherBookingCard key={offer.id} booking={offer.booking} assignment={offer} busy={Boolean(busy)} onAccept={() => respond(offer, true)} onReject={() => respond(offer, false)} />)}</div> : !data && error ? <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Requests will appear here when your washer workspace is available.</div> : <div className="mt-4 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{loading ? "Checking for requests..." : online ? "You're online. New eligible requests will appear here." : "Go online to receive nearby booking requests."}</div>}
        <Link to="/washer/profile" className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-green-700 hover:underline">Manage availability <ArrowRight size={16} /></Link>
      </section>
    </section>
  </main>;
}
