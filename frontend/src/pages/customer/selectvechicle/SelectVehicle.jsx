import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { vehicles } from "./data";
import SelectVehicleContent from "./SelectVehicleContent";

function SelectVehicle() {
  const { updateBooking } = useBooking();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(1);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const handleContinue = () => {
    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.id === selected
    );

    if (!selectedVehicle) return;

    updateBooking({
      vehicle: selectedVehicle,
    });

    navigate("/customer/select-package");
  };

  return (
    <SelectVehicleContent navigate={navigate} selected={selected} setSelected={setSelected} showAddVehicle={showAddVehicle} setShowAddVehicle={setShowAddVehicle} handleContinue={handleContinue} />
  );
}

export default SelectVehicle;
