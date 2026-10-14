import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import RegisterContent from "./RegisterContent";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");

    if (!form.fullName || !form.phone || !form.email || !form.password) {
      setError("Please complete all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const data = await register({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
      if (data.session) {
        navigate("/customer");
        return;
      }
      setSuccess("Account created. Please check your email to verify your account.");
    } catch (error) {
      setError(error?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContent
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirm={showConfirm}
      setShowConfirm={setShowConfirm}
      form={form}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      loading={loading}
      error={error}
      success={success}
    />
  );
}

export default Register;
