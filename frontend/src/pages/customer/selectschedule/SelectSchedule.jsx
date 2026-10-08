import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { dates } from "./data";
import SelectScheduleContent from "./SelectScheduleContent";

function SelectSchedule() {
  const { updateSchedule } = useBooking();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(2);
  const [selectedTime, setSelectedTime] =
    useState("10:30 AM");

  const handleContinue = () => {
    const selectedDateData = dates.find(
      (item) => item.id === selectedDate
    );

    if (!selectedDateData || !selectedTime) return;

    updateSchedule({
      date: selectedDateData,
      time: selectedTime,
    });

    navigate("/customer/booking-review");
  };

  return (
    <SelectScheduleContent navigate={navigate} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTime={selectedTime} setSelectedTime={setSelectedTime} handleContinue={handleContinue} />
  );
}

export default SelectSchedule;
