import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import { dates } from "./data";
import { times } from "./data";

function SelectScheduleContent({ navigate, selectedDate, setSelectedDate, selectedTime, setSelectedTime, handleContinue }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={4} />

      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <button
          onClick={() =>
            navigate("/customer/select-package")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7">
          <p className="font-semibold text-blue-600">
            SCHEDULE
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            When should we come?
          </h1>

          <p className="mt-2 text-slate-500">
            Choose your preferred service date and time.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays />
            </div>

            <div>
              <h2 className="font-bold">
                Select Date
              </h2>

              <p className="text-sm text-slate-500">
                Available dates
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {dates.map((item) => {
              const active = selectedDate === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedDate(item.id)}
                  className={`rounded-2xl border p-4 transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      active
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {item.day}
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {item.date}
                  </p>

                  <p
                    className={`text-xs ${
                      active
                        ? "text-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {item.month}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="my-8 border-t border-slate-100" />

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 />
            </div>

            <div>
              <h2 className="font-bold">
                Select Time
              </h2>

              <p className="text-sm text-slate-500">
                Available time slots
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {times.map((time) => {
              const active = selectedTime === time;

              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-blue-300"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex justify-end">
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white"
          >
            Review Booking
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectScheduleContent;
