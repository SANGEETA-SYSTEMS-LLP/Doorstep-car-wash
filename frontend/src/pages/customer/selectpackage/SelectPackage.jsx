import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { packages } from "./data";
import SelectPackageContent from "./SelectPackageContent";

function SelectPackage() {
  const { booking, updateBooking } = useBooking();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(2);

  const handleContinue = () => {
    const selectedPackage = packages.find(
      (pkg) => pkg.id === selected
    );

    if (!selectedPackage) return;

    updateBooking({
      package: selectedPackage,
    });

    navigate("/customer/select-schedule");
  };

  return (
    <SelectPackageContent booking={booking} navigate={navigate} selected={selected} setSelected={setSelected} handleContinue={handleContinue} />
  );
}

export default SelectPackage;
