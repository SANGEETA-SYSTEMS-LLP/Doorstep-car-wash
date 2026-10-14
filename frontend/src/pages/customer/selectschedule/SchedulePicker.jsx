import { CalendarDays, Clock3 } from "lucide-react";


function SchedulePicker({ dates, slots, selectedDate, setSelectedDate, selectedTime, setSelectedTime }) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarDays />
        </div>
        <div>
          <h2 className="font-bold">Select Date</h2>
          <p className="text-sm text-slate-500">Next 30 days · India time (IST)</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {dates.slice(0, 6).map((item) => {
          const active = selectedDate === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedDate(item.id)}
              className={`rounded-2xl border p-4 transition ${
                active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 hover:border-blue-300"
              }`}
            >
              <p className={`text-xs ${active ? "text-blue-100" : "text-slate-400"}`}>{item.today ? "Today" : item.day}</p>
              <p className="mt-1 text-2xl font-bold">{item.date}</p>
              <p className={`text-xs ${active ? "text-blue-100" : "text-slate-400"}`}>{item.month} {item.year}</p>
            </button>
          );
        })}
      </div>
      <label className="mt-5 block text-sm font-semibold">Choose another date<input type="date" min={dates[0].iso} max={dates.at(-1).iso} value={dates.some(day => day.iso === selectedDate) ? selectedDate : ""} onChange={event => setSelectedDate(event.target.value)} className="ml-3 rounded-xl border border-slate-300 p-3" /></label>
      <div className="my-8 border-t border-slate-100" />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Clock3 />
        </div>
        <div>
          <h2 className="font-bold">Select Time</h2>
          <p className="text-sm text-slate-500">Past times are disabled · All times are IST</p>
        </div>
      </div>
      {slots.every(slot => slot.disabled) && <p role="status" className="mt-4 text-amber-800">No future slots remain for this date. Please choose another day.</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map(({ time, disabled }) => {
          const active = selectedTime === time;
          return (
            <button
              key={time}
              disabled={disabled}
              aria-pressed={active && !disabled}
              onClick={() => setSelectedTime(time)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                active && !disabled ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SchedulePicker;
