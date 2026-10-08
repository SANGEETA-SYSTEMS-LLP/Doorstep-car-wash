import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginBenefits from "./LoginBenefits";
import LoginForm from "./LoginForm";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporary frontend-only login.
    // Supabase authentication will be connected later.
    console.log("Login:", form);

    navigate("/customer");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* LEFT SIDE */}

      <LoginBenefits />

      {/* RIGHT SIDE */}

      <LoginForm showPassword={showPassword} setShowPassword={setShowPassword} form={form} handleChange={handleChange} handleSubmit={handleSubmit} />
    </div>
  );
}

export default Login;
