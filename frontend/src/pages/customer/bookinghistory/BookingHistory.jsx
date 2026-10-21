import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck2,
  CalendarDays,
  History,
  Plus,
  ReceiptText,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { getMyBookings } from "../../../services/booking/bookingService";
import BookingHistoryCard from "./BookingHistoryCard";
import {
  cancelledStatuses,
  completedStatuses,
} from "./bookingHistoryUtils";

const filters = [
  { id: "all", label: "All bookings" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const upcomingStatuses = [
  "pending",
  "payment_completed",
  "finding_washer",
  "washer_assigned",
  "washer_on_the_way",
  "washer_arrived",
  "otp_verified",
  "service_started",
];

function BookingHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      setBookings([]);
      setError("");

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getMyBookings(user.id);
        if (!cancelled) setBookings(data);
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Unable to load your bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [reloadCount, user]);

  const counts = useMemo(() => ({
    all: bookings.length,
    upcoming: bookings.filter((booking) =>
      upcomingStatuses.includes(booking.status)
    ).length,
    completed: bookings.filter((booking) =>
      completedStatuses.includes(booking.status)
    ).length,
    cancelled: bookings.filter((booking) =>
      cancelledStatuses.includes(booking.status)
    ).length,
  }), [bookings]);

  const visibleBookings = useMemo(() => {
    if (activeFilter === "all") return bookings;

    return bookings.filter((booking) => {
      if (activeFilter === "upcoming") {
        return upcomingStatuses.includes(booking.status);
      }
      if (activeFilter === "completed") {
        return completedStatuses.includes(booking.status);
      }
      return cancelledStatuses.includes(booking.status);
    });
  }, [activeFilter, bookings]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Your activity
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Booking history
            </h1>
            <p className="mt-2 max-w-xl text-slate-500">
              Keep track of your car care appointments, service details, and payments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/customer/select-location")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Plus size={18} />
            Book a wash
          </button>
        </header>

        <section
          aria-label="Booking totals"
          className="mt-7 grid gap-4 sm:grid-cols-3"
        >
          <SummaryCard
            icon={<ReceiptText size={19} />}
            label="Total bookings"
            value={loading ? "—" : counts.all}
            iconStyle="bg-blue-50 text-blue-700"
          />
          <SummaryCard
            icon={<CalendarCheck2 size={19} />}
            label="Upcoming"
            value={loading ? "—" : counts.upcoming}
            iconStyle="bg-amber-50 text-amber-700"
          />
          <SummaryCard
            icon={<History size={19} />}
            label="Completed services"
            value={loading ? "—" : counts.completed}
            iconStyle="bg-emerald-50 text-emerald-700"
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 pt-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Your bookings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Getting your latest booking records..."
                    : `${visibleBookings.length} ${
                        visibleBookings.length === 1 ? "record" : "records"
                      }`}
                </p>
              </div>
              <div
                role="tablist"
                aria-label="Filter bookings by status"
                className="flex max-w-full gap-1 overflow-x-auto"
              >
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                      activeFilter === filter.id
                        ? "border-blue-700 text-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {filter.label}
                    {!loading && (
                      <span className="ml-1.5 text-xs text-slate-400">
                        {counts[filter.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {loading && (
              <div role="status" className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-40 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
                <span className="sr-only">Loading your bookings...</span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
                <button
                  type="button"
                  onClick={() => setReloadCount((count) => count + 1)}
                  className="ml-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && visibleBookings.map((booking) => (
              <BookingHistoryCard
                key={booking.id}
                booking={booking}
                onDetails={() => navigate(`/customer/bookings/${booking.id}`)}
              />
            ))}

            {!loading && !error && visibleBookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                  {activeFilter === "all"
                    ? <CalendarDays size={23} />
                    : <History size={23} />}
                </div>
                <h3 className="mt-4 font-bold text-slate-900">
                  {activeFilter === "all"
                    ? "No bookings yet"
                    : `No ${activeFilter} bookings`}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  {activeFilter === "all"
                    ? "Your appointments will appear here once you book your first car wash."
                    : "There are no records in this category right now."}
                </p>
                {activeFilter === "all" && (
                  <button
                    type="button"
                    onClick={() => navigate("/customer/select-location")}
                    className="mt-5 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Book your first wash
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, iconStyle }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

export default BookingHistory;
