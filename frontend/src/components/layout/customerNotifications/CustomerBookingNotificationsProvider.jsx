import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiRequest } from "../../../services/core/api";
import { NotificationContext, sortNotifications } from "./notificationContext";
import BookingNotificationToast from "./BookingNotificationToast";
import { showDesktopNotification } from "./notificationUtilities";
import { useAutoDismiss } from "./useAutoDismiss";

export default function CustomerBookingNotifications({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const dismissToast = useCallback(() => setToast(null), []);

  useAutoDismiss(toast, dismissToast, 8000);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    const knownIds = new Set();
    let initialized = false;
    const refreshNotifications = async () => {
      try {
        const { notifications: data = [] } = await apiRequest("/customer/notifications");
        if (!active) return;
        const fresh = data.filter((notification) => notification?.id && !knownIds.has(notification.id));
        for (const notification of data) knownIds.add(notification.id);
        setNotifications(sortNotifications(data));
        setError("");
        if (initialized && fresh.length) {
          const newest = fresh.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
          setToast(newest);
          showDesktopNotification(newest);
        }
        initialized = true;
      } catch (loadError) {
        if (!active) return;
        console.error("Unable to load customer notifications:", loadError);
        setError("Notifications could not be loaded. Please refresh and try again.");
      }
    };
    refreshNotifications();
    const poll = setInterval(refreshNotifications, 30000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [user?.id]);

  const markRead = useCallback(async (notificationId) => {
    await apiRequest(`/customer/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" });

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
  }, []);

  const value = {
    notifications,
    error,
    markRead,
    toast,
    dismissToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <BookingNotificationToast />
    </NotificationContext.Provider>
  );
}

