import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterContent from "./RegisterContent";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log("Registration:", form);

    // Temporary UI flow.
    navigate("/customer/select-location");
  };

  return (
    <RegisterContent showPassword={showPassword} setShowPassword={setShowPassword} showConfirm={showConfirm} setShowConfirm={setShowConfirm} form={form} handleChange={handleChange} handleSubmit={handleSubmit} />
  );
}

export default Register;
