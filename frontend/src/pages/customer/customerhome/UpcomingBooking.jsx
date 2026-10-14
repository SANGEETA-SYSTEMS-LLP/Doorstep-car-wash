import { CalendarDays, Car, ChevronRight, Clock3 } from "lucide-react";

function UpcomingBooking() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming booking</h2>
        <button className="text-sm font-semibold text-blue-600">View all</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Car />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-bold">Premium Car Wash</h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Scheduled</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Hyundai Creta • SUV</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2"><CalendarDays size={16} />8 October</span>
                <span className="flex items-center gap-2"><Clock3 size={16} />10:30 AM</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 font-semibold text-blue-600">
            View Details <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default UpcomingBooking;
