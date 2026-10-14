import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { useAuth } from "../../../context/AuthContext";
import { getMyVehicles } from "../../../services/vehicleService";
import SelectVehicleContent from "./SelectVehicleContent";

function SelectVehicle() {
  const { booking, updateBooking } = useBooking();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(booking.vehicle?.id || "");

  useEffect(() => {
    let cancelled = false;

    const loadVehicles = async () => {
      setVehicles([]);
      setError("");
      if (!user) {
        setSelected("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getMyVehicles(user.id);
        if (cancelled) return;
        setVehicles(data);
        setSelected((previous) =>
          data.some((vehicle) => vehicle.id === previous)
            ? previous
            : data[0]?.id || ""
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Unable to load vehicles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadVehicles();
    return () => { cancelled = true; };
  }, [user]);

  const handleContinue = () => {
    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.id === selected
    );

    if (loading) return;

    if (!selectedVehicle) {
      setError("Please select a vehicle.");
      return;
    }

    setError("");

    updateBooking({
      ...(booking.vehicle?.id !== selectedVehicle.id || booking.vehicle?.type !== selectedVehicle.vehicle_type ? { package: null, databaseBookingId: null, bookingId: null } : {}),
      vehicle: {
        id: selectedVehicle.id,
        name: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        brand: selectedVehicle.brand,
        model: selectedVehicle.model,
        type: selectedVehicle.vehicle_type,
        number: selectedVehicle.vehicle_number,
        colour: selectedVehicle.colour,
      },
    });

    navigate("/customer/select-package");
  };

  return (
    <SelectVehicleContent navigate={navigate} selected={selected} setSelected={setSelected} vehicles={vehicles} loading={loading} error={error} handleContinue={handleContinue} />
  );
}

export default SelectVehicle;
