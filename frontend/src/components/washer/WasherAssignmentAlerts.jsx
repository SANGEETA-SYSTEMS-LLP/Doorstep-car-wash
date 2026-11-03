import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WasherAssignmentAlerts({ userId, data }) {
  const navigate = useNavigate();
  const [permission, setPermission] = useState(() => typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  const [alert, setAlert] = useState(null);
  const seen = useRef({ userId: null, ids: new Set() });

  useEffect(() => {
    if (!userId || !data || data.sessionUserId !== userId) return;
    const offers = data.assignments || [];
    const ids = new Set(offers.map(offer => offer.id));
    if (seen.current.userId !== userId) {
      seen.current = { userId, ids: new Set() };
    }
    const fresh = offers.filter(offer => !seen.current.ids.has(offer.id));
    for (const id of ids) seen.current.ids.add(id);
    if (!fresh.length) return;

    const newest = fresh[fresh.length - 1];
    const booking = newest.booking || {};
    const title = fresh.length === 1 ? "New car wash job assigned" : `${fresh.length} new car wash jobs assigned`;
    const detail = booking.package?.name || booking.booking_number || "Review the new washer assignment.";
    setAlert({ id: newest.id, title, detail });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const notification = new Notification(title, { body: detail, tag: `washer-assignment-${newest.id}` });
        notification.onclick = () => {
          window.focus();
          navigate("/washer/jobs");
          notification.close();
        };
      } catch { /* The in-panel alert remains available if browser notifications are blocked. */ }
    }
  }, [userId, data, navigate]);

  useEffect(() => {
    if (!alert) return undefined;
    const timer = window.setTimeout(() => setAlert(null), 20000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try { setPermission(await Notification.requestPermission()); }
    catch { setPermission("denied"); }
  }

  return <>
    {permission === "default" && <button type="button" onClick={enableNotifications} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Show browser notifications when a supervisor assigns a job"><Bell size={15} />Enable job alerts</button>}
    {permission === "granted" && <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800"><BellRing size={15} />Job alerts on</span>}
    {permission === "denied" && <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500" title="Browser notifications are blocked. New assignments still appear in the washer panel."><Bell size={15} />Panel alerts on</span>}
    {alert && <div role="alert" className="fixed right-4 top-20 z-[60] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-green-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-green-50 p-2 text-green-700"><BellRing size={19} /></span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{alert.title}</p><p className="mt-1 truncate text-sm text-slate-600">{alert.detail}</p><button type="button" onClick={() => { setAlert(null); navigate("/washer/jobs"); }} className="mt-3 text-sm font-semibold text-green-800 underline">Review assignment</button></div><button type="button" aria-label="Dismiss job notification" onClick={() => setAlert(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button></div>
    </div>}
  </>;
}
