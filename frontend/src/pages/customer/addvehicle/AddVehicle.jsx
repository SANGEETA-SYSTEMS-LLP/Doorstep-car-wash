import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddVehicleContent from "./AddVehicleContent";

function AddVehicle() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    vehicleNumber: "",
    vehicleType: "",
    brand: "",
    model: "",
    colour: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Vehicle:", form);

    setSaved(true);

    setTimeout(() => {
      navigate("/customer/vehicles");
    }, 1000);
  };

  return (
    <AddVehicleContent navigate={navigate} saved={saved} form={form} handleChange={handleChange} handleSubmit={handleSubmit} />
  );
}

export default AddVehicle;
