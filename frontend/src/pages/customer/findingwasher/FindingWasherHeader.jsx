function FindingWasherHeader({ booking, washerFound }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Booking {booking.bookingId || "Pending"}
          </p>
          <h1 className="mt-1 text-xl font-bold">
            {washerFound ? "Washer Assigned" : "Finding Your Washer"}
          </h1>
        </div>
        <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
          Booking Confirmed
        </div>
      </div>
    </header>
  );
}

export default FindingWasherHeader;
