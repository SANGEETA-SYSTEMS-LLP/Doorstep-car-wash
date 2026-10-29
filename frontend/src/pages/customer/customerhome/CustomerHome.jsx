import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Car, Clock3, MapPin } from "lucide-react";
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
        <section className="relative overflow-hidden border border-[#315c49] bg-[#183a2e] px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a8d7bf]">Doorstep car care</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Your car deserves a fresh start.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#e0eee6] sm:text-base">Choose your location, select your vehicle and schedule a professional car wash.</p>
            <Link to="/customer/select-location" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#328c64] px-5 py-3 font-semibold text-white transition hover:bg-[#3a9a70] focus:outline-none focus:ring-4 focus:ring-[#a8d7bf]/40">Book a wash <ArrowRight size={18}/></Link>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 hidden h-72 w-72 rounded-full border border-white/10 sm:block" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-9 hidden h-52 w-52 rounded-full border border-white/10 sm:block" />
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
            value={loading ? "-" : dashboardData.vehicles.length}
            text="Registered vehicles"
            to="/customer/vehicles"
          />

          <QuickCard
            icon={<CalendarDays />}
            title="Bookings"
            value={loading ? "-" : dashboardData.bookings.length}
            text="All your bookings"
            to="/customer/history"
          />

          <QuickCard
            icon={<Clock3 />}
            title="Upcoming"
            value={loading ? "-" : upcomingBookings.length}
            text="Active and scheduled"
            to="/customer/history"
          />

          <QuickCard
            icon={<MapPin />}
            title="Saved Places"
            value={loading ? "-" : dashboardData.addresses.length}
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
