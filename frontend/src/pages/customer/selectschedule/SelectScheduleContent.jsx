import { ArrowLeft, ArrowRight } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import SchedulePicker from "./SchedulePicker";

function SelectScheduleContent({ navigate, selectedDate, setSelectedDate, selectedTime, setSelectedTime, handleContinue, dates, slots, valid, error }) {
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
            Choose your preferred service date and time in India Standard Time (IST). Washer assignment is subject to availability.
          </p>
        </div>

        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <SchedulePicker
          dates={dates}
          slots={slots}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
        />

        <div className="mt-7 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!valid}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
