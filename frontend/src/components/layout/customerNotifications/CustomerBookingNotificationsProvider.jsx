import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/auth/supabase";
import { NotificationContext, MAX_NOTIFICATIONS, sortNotifications } from "./notificationContext";
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
    let initialized = false;
    let channel;
    const pendingEvents = [];
    const knownIds = new Set();

    const addNotification = (notification, showToast) => {
      if (!notification?.id) return;

      const isNew = !knownIds.has(notification.id);
      knownIds.add(notification.id);
      setNotifications((current) =>
        sortNotifications([
          notification,
          ...current.filter((item) => item.id !== notification.id),
        ])
      );

      if (showToast && isNew) {
        setToast(notification);
        showDesktopNotification(notification);
      }
    };

    const handleNotificationChange = (payload) => {
      if (payload.eventType === "INSERT") {
        addNotification(payload.new, true);
      } else if (payload.eventType === "UPDATE") {
        addNotification(payload.new, false);
      }
    };

    async function startSubscription() {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (customerError) {
        console.error("Unable to load customer notification account:", customerError);
        setError("Notifications could not be loaded. Please refresh and try again.");
        return;
      }

      if (!customer) return;

      channel = supabase
        .channel(`customer-notifications-${customer.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "customer_notifications",
            filter: `customer_id=eq.${customer.id}`,
          },
          (payload) => {
            if (!active) return;
            if (!initialized) {
              pendingEvents.push(payload);
              return;
            }
            handleNotificationChange(payload);
          }
        )
        .subscribe(async (status) => {
          if (!active) return;

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`Customer notification channel ${status.toLowerCase()}.`);
            setError("Live notifications could not be connected. Please refresh and try again.");
            return;
          }

          if (status !== "SUBSCRIBED" || initialized) return;

          const { data, error: notificationsError } = await supabase
            .from("customer_notifications")
            .select("id, booking_id, booking_number, event_type, title, message, created_at, read_at")
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false })
            .limit(MAX_NOTIFICATIONS);

          if (!active) return;

          if (notificationsError) {
            console.error("Unable to load customer notifications:", notificationsError);
            setError("Notifications could not be loaded. Please refresh and try again.");
            return;
          }

          for (const notification of data || []) {
            knownIds.add(notification.id);
          }
          setNotifications(sortNotifications(data || []));
          setError("");
          initialized = true;

          for (const event of pendingEvents.splice(0)) {
            if (event.eventType !== "INSERT" || !knownIds.has(event.new?.id)) {
              handleNotificationChange(event);
            }
          }
        });
    }

    startSubscription().catch((subscriptionError) => {
      if (!active) return;
      console.error("Unable to start customer notifications:", subscriptionError);
      setError("Notifications could not be connected. Please refresh and try again.");
    });

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = useCallback(async (notificationId) => {
    const { error: updateError } = await supabase
      .from("customer_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .is("read_at", null);

    if (updateError) {
      console.error("Unable to mark notification as read:", updateError);
      throw updateError;
    }

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

