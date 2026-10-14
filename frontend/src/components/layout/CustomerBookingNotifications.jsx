import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";

const statusMessages = {
  finding_washer: "We're finding a washer for your booking.",
  washer_assigned: "A washer has been assigned to your booking.",
  washer_on_the_way: "Your washer is on the way.",
  washer_arrived: "Your washer has arrived.",
  otp_verified: "Your service has been verified and is ready to start.",
  service_started: "Your car wash service has started.",
  service_completed: "Service photos are submitted and awaiting validation.",
  completed: "Your booking is complete. Thank you!",
  customer_approved: "Your extra charge request was approved.",
  customer_rejected: "Your extra charge request was rejected.",
  customer_confirmed: "Your booking is complete. Thank you!",
  rejected: "Your booking could not be assigned a washer.",
  expired: "Your booking assignment has expired.",
};

function getBookingLabel(booking) {
  return booking.booking_number
    ? `Booking ${booking.booking_number}`
    : "Your booking";
}

function CustomerBookingNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) return undefined;

    const timeoutId = window.setTimeout(
      () => setNotification(null),
      8000
    );

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    let initialized = false;
    const knownStatuses = new Map();
    const pendingEvents = [];
    let channel;

    const handleBookingChange = (payload) => {
      const booking = payload.new;

      if (payload.eventType === "INSERT") {
        knownStatuses.set(booking.id, booking.status);
        setNotification({
          userId: user.id,
          title: "Booking created",
          message: `${getBookingLabel(booking)} has been created.`,
        });
        return;
      }

      const previousStatus = knownStatuses.get(booking.id);
      knownStatuses.set(booking.id, booking.status);

      if (
        previousStatus !== undefined &&
        previousStatus !== booking.status
      ) {
        setNotification({
          userId: user.id,
          title: "Booking update",
          message:
            statusMessages[booking.status] ||
            `${getBookingLabel(booking)} status: ${String(
              booking.status || "updated"
            ).replaceAll("_", " ")}.`,
        });
      }
    };

    const startSubscription = async () => {
      const {
        data: customer,
        error: customerError,
      } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!active) return;

      if (customerError) {
        console.error(
          "Customer booking notifications could not resolve the customer:",
          customerError
        );
        return;
      }

      channel = supabase
        .channel(`customer-booking-notifications-${customer.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `customer_id=eq.${customer.id}`,
          },
          (payload) => {
            if (!active) return;

            if (!initialized) {
              pendingEvents.push(payload);
              return;
            }

            handleBookingChange(payload);
          }
        )
        .subscribe(async (status) => {
          if (!active) return;

          if (status === "SUBSCRIBED" && !initialized) {
            const {
              data: bookings,
              error: bookingsError,
            } = await supabase
              .from("bookings")
              .select("id, status, booking_number")
              .eq("customer_id", customer.id);

            if (!active) return;

            if (bookingsError) {
              console.error(
                "Unable to initialize customer booking notifications:",
                bookingsError
              );
              return;
            }

            for (const booking of bookings || []) {
              knownStatuses.set(
                booking.id,
                booking.status
              );
            }

            initialized = true;
            for (const event of pendingEvents.splice(0)) {
              handleBookingChange(event);
            }
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            console.error(
              `Customer booking notification channel ${status.toLowerCase()}.`
            );
          }
        });
    };

    startSubscription().catch((error) => {
      if (active) {
        console.error(
          "Unable to start customer booking notifications:",
          error
        );
      }
    });

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  if (!notification || notification.userId !== user?.id) {
    return null;
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-blue-200 bg-white p-4 shadow-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Bell
          size={20}
          className="mt-0.5 shrink-0 text-blue-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {notification.message}
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
            onClick={() => {
              setNotification(null);
              navigate("/customer/history");
            }}
          >
            View bookings
          </button>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setNotification(null)}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default CustomerBookingNotifications;
