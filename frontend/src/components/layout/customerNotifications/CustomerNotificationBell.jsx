import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { NotificationContext } from "./notificationContext";
import { formatNotificationTime, requestDesktopNotificationPermission } from "./notificationUtilities";

export function CustomerNotificationBell() {
  const context = useContext(NotificationContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!context) return null;

  const unreadCount = context.notifications.filter(
    (notification) => !notification.read_at
  ).length;

  const openNotification = async (notification) => {
    setActionError("");
    try {
      if (!notification.read_at) {
        await context.markRead(notification.id);
      }
      setOpen(false);
      navigate(
        notification.booking_id
          ? `/customer/bookings/${notification.booking_id}`
          : "/customer/history"
      );
    } catch (error) {
      setActionError(
        error.message || "Unable to open this notification. Please try again."
      );
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-green-600/10"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Notification inbox"
          className="absolute right-0 top-12 z-40 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-[#fbfcfb] shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "You are all caught up"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close notifications"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {context.error ? (
            <p role="alert" className="p-4 text-sm text-red-700">{context.error}</p>
          ) : context.notifications.length ? (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {context.notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                      notification.read_at ? "" : "bg-green-50/60"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.read_at ? "bg-slate-200" : "bg-green-600"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-slate-600">
                          {notification.message}
                        </span>
                        <time
                          className="mt-2 block text-xs text-slate-400"
                          dateTime={notification.created_at}
                        >
                          {formatNotificationTime(notification.created_at)}
                        </time>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <Bell className="mx-auto text-slate-300" size={25} />
              <p className="mt-2 text-sm text-slate-600">
                Booking updates will appear here.
              </p>
            </div>
          )}

          {actionError && (
            <p role="alert" className="border-t border-red-100 px-4 py-2 text-xs text-red-700">
              {actionError}
            </p>
          )}

          {"Notification" in window &&
            window.Notification.permission !== "granted" && (
              <div className="border-t border-slate-100 p-3">
                <button
                  type="button"
                  onClick={requestDesktopNotificationPermission}
                  className="w-full rounded-lg py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                >
                  Enable desktop alerts
                </button>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
