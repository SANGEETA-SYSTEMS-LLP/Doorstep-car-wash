import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Car, Clock3, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getMyBookings } from "../../../services/booking/bookingService";
import { getSavedAddresses } from "../../../services/locations/locationService";
import { getMyVehicles } from "../../../services/customer/vehicleService";
import QuickCard from "./QuickCard";
import CustomerHomeLocation from "./CustomerHomeLocation";
import CustomerHomeHeader from "./CustomerHomeHeader";
import UpcomingBooking from "./UpcomingBooking";

const upcomingStatuses = new Set([
  "pending",
  "payment_completed",
  "finding_washer",
  "washer_assigned",
  "washer_on_the_way",
  "washer_arrived",
  "otp_verified",
  "service_started",
]);

const inProgressStatuses = new Set([
  "washer_on_the_way",
  "washer_arrived",
  "otp_verified",
  "service_started",
]);

function CustomerHome() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    vehicles: [],
    addresses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      if (!user?.id) {
        setDashboardData({ bookings: [], vehicles: [], addresses: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [bookings, vehicles, addresses] = await Promise.all([
          getMyBookings(user.id),
          getMyVehicles(user.id),
          getSavedAddresses(user.id),
        ]);

        if (active) {
          setDashboardData({ bookings, vehicles, addresses });
        }
      } catch (loadError) {
        console.error("Unable to load customer dashboard:", loadError);
        if (active) {
          setError("Unable to load your dashboard details. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [reloadCount, user?.id]);

  const upcomingBookings = useMemo(() => {
    return dashboardData.bookings
      .filter((booking) => isUpcomingOrInProgress(booking, now))
      .map((booking) => ({
        booking,
        scheduleKey: getScheduleKey(booking),
      }))
      .sort((first, second) => {
        const firstInProgress = inProgressStatuses.has(first.booking.status);
        const secondInProgress = inProgressStatuses.has(second.booking.status);
        if (firstInProgress !== secondInProgress) {
          return firstInProgress ? -1 : 1;
        }
        if (!first.scheduleKey) return 1;
        if (!second.scheduleKey) return -1;
        return first.scheduleKey.localeCompare(second.scheduleKey);
      })
      .map(({ booking }) => booking);
  }, [dashboardData.bookings, now]);

  return (
    <div>
      <CustomerHomeHeader />

      <div className="mx-auto max-w-[1440px] p-5 sm:p-6 lg:p-8">
        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-7 text-white shadow-lg shadow-blue-950/10 sm:p-9 lg:p-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full border-[44px] border-white/[0.06]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-8rem] right-1/3 -z-10 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative z-10 max-w-xl">
            <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-cyan-100">
              <Sparkles size={16} />
              Doorstep car care
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Your car deserves a fresh start.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-blue-100 sm:text-base">
              Choose your location, select your vehicle and
              schedule a professional car wash in minutes.
            </p>

            <Link
              to="/customer/select-location"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Book a Wash
              <ArrowRight size={18} />
            </Link>
          </div>

          <Car className="absolute -bottom-10 right-8 hidden h-64 w-64 text-white/10 xl:block" />
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="font-semibold underline"
            >
              Reload dashboard
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <QuickCard
            icon={<Car />}
            title="My Vehicles"
            value={loading ? "—" : dashboardData.vehicles.length}
            text="Registered vehicles"
            to="/customer/vehicles"
          />

          <QuickCard
            icon={<CalendarDays />}
            title="Bookings"
            value={loading ? "—" : dashboardData.bookings.length}
            text="All your bookings"
            to="/customer/history"
          />

          <QuickCard
            icon={<Clock3 />}
            title="Upcoming"
            value={loading ? "—" : upcomingBookings.length}
            text="Active and scheduled"
            to="/customer/history"
          />

          <QuickCard
            icon={<MapPin />}
            title="Saved Places"
            value={loading ? "—" : dashboardData.addresses.length}
            text="Saved addresses"
            to="/customer/select-location"
          />
        </section>

        <UpcomingBooking booking={upcomingBookings[0] || null} loading={loading} />

        <CustomerHomeLocation
          location={dashboardData.addresses[0] || null}
          loading={loading}
        />
      </div>
    </div>
  );
}

function getScheduleKey(booking) {
  const date = booking.scheduled_date;
  const time =
    booking.scheduled_start_time ||
    booking.scheduled_time ||
    "00:00";
  return date ? `${date}T${time}` : null;
}

function isUpcomingOrInProgress(booking, now) {
  if (!upcomingStatuses.has(booking.status)) {
    return false;
  }

  if (inProgressStatuses.has(booking.status)) {
    return true;
  }

  if (!booking.scheduled_date) {
    return true;
  }

  const scheduledTime =
    booking.scheduled_start_time ||
    booking.scheduled_time;
  const endOfDay = !scheduledTime;
  const appointment = new Date(
    `${booking.scheduled_date}T${scheduledTime || "23:59:59"}`
  );

  return Number.isNaN(appointment.getTime()) ||
    (endOfDay
      ? appointment >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : appointment >= now);
}

export default CustomerHome;
