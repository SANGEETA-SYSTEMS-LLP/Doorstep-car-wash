import { Bell, X } from "lucide-react";
import { useContext } from "react";
import { NotificationContext } from "./notificationContext";

export default function BookingNotificationToast() {
  const context = useContext(NotificationContext);
  if (!context?.toast) return null;

  return (
    <div
      className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-blue-200 bg-white p-4 shadow-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Bell size={20} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">{context.toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{context.toast.message}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={context.dismissToast}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

