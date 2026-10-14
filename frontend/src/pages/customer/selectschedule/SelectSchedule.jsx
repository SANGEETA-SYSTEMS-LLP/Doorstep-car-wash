import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { scheduleDates, times, canSelectSlot } from "./data";
import SelectScheduleContent from "./SelectScheduleContent";

export default function SelectSchedule() {
  const { booking, updateSchedule } = useBooking();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now);
  const [selectedDate, setSelectedDate] = useState(() => booking.schedule?.date?.iso || scheduleDates()[0].iso);
  const [selectedTime, setSelectedTime] = useState(() => booking.schedule?.time || "");
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const dates = scheduleDates(now);
  const slots = times.map(time => ({ time, disabled: !canSelectSlot(selectedDate, time, now) }));
  const valid = canSelectSlot(selectedDate, selectedTime, now);
  function changeDate(iso) { setSelectedDate(iso); setSelectedTime(""); setError(""); }
  function changeTime(time) { setSelectedTime(time); setError(""); }
  function handleContinue() {
    const current = Date.now();
    if (!canSelectSlot(selectedDate, selectedTime, current)) { setNow(current); setError("Please choose a future date and time. This slot may have just passed."); return; }
    updateSchedule({ date: scheduleDates(current).find(day => day.iso === selectedDate), time: selectedTime });
    navigate("/customer/booking-review");
  }
  return <SelectScheduleContent {...{ navigate, dates, slots, selectedDate, selectedTime, handleContinue, valid, error }} setSelectedDate={changeDate} setSelectedTime={changeTime} />;
}
