import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createVehicle } from "../../../services/customer/vehicleService";
import AddVehicleContent from "./AddVehicleContent";

function AddVehicle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vehicleNumber: "",
    vehicleType: "",
    customVehicleType: "",
    brand: "",
    model: "",
    colour: "",
    seatingCapacity: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!user) {
      setError("Please login before adding a vehicle.");
      return;
    }

    if (
      !form.vehicleNumber ||
      !form.vehicleType ||
      !form.brand ||
      !form.model
    ) {
      setError("Please complete all required vehicle details.");
      return;
    }

    const vehicleType = form.vehicleType === "other"
      ? form.customVehicleType.trim()
      : form.vehicleType;
    if (!vehicleType || vehicleType.length > 50) {
      setError("Enter your vehicle type (1–50 characters).");
      return;
    }
    const seatingCapacity = Number(form.seatingCapacity);
    if (!Number.isInteger(seatingCapacity) || seatingCapacity < 2 || seatingCapacity > 20) {
      setError("Enter a valid seating capacity from 2 to 20.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createVehicle({
        userId: user.id,
        vehicleNumber: form.vehicleNumber,
        vehicleType,
        brand: form.brand,
        model: form.model,
        colour: form.colour,
        seatingCapacity,
      });

      navigate("/customer/vehicles", { replace: true });
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to add vehicle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddVehicleContent navigate={navigate} loading={loading} error={error} form={form} handleChange={handleChange} handleSubmit={handleSubmit} />
  );
}

export default AddVehicle;
