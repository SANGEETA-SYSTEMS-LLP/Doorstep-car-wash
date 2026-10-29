import { ArrowLeft, Navigation } from "lucide-react";

function TrackingHeader({ booking, washer, currentStatus, navigate }) {
  const statusLabel = currentStatus === "service_completed"
    ? "Awaiting validation"
    : currentStatus === "completed"
      ? "Completed"
      : ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started"].includes(currentStatus)
        ? "In Progress"
        : "Finding a washer";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customer")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
              {booking.bookingId || "Booking"}
            </p>
            <h1 className="text-xl font-bold">Track Your Washer</h1>
            {(washer?.referenceId || washer?.name) && (
              <p className="mt-1 break-all text-xs text-slate-500">
                {washer.name}{washer.referenceId ? ` · ${washer.referenceId}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 sm:flex">
          <Navigation size={16} />
          {statusLabel}
        </div>
      </div>
    </header>
  );
}

export default TrackingHeader;
