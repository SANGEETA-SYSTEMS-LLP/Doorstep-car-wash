import { validServiceAddress } from "../../../services/locationSelection";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { apiRequest } from "../../../services/api";
import RegisterContent from "./RegisterContent";

function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountType = ["supervisor", "washer"].includes(params.get("role")) ? params.get("role") : "customer";
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
  const [address, setAddress] = useState({});
  const [locationBusy, setLocationBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || locationBusy) return;
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

    const addressComplete = validServiceAddress(address) && address.city?.trim() && address.state?.trim() && /^\d{6}$/.test(address.postalCode || "");
    if (accountType === "washer" && !addressComplete) {
      setError("Washer signup requires a selected map location, complete street address, city, state and 6-digit PIN code for supervisor verification.");
      return;
    }
    if (accountType === "customer" && Object.values(address).some(Boolean) && !addressComplete) {
      setError("Choose your location, enter a complete address (at least 10 characters), city, state and 6-digit PIN code, or clear the optional address.");
      return;
    }

    try {
      setLoading(true);
      const data = await register({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        password: form.password,
        requestedRole: accountType,
        signupAddress: ["customer", "washer"].includes(accountType) && validServiceAddress(address) ? address : null,
      });
      if (accountType === "washer") {
        try {
          await apiRequest("/auth/washer-signup", {
            method: "POST",
            body: JSON.stringify({ userId: data.user?.id }),
          });
        } catch (syncError) {
          console.error("Washer application submission failed:", syncError);
          setSuccess("Your account was created, but we could not submit the verification application yet. Sign in to your washer account once, or try again later, so your details can be sent to the supervisor.");
          return;
        }
        if (data.session) navigate("/dashboard");
        else setSuccess("Washer account created and sent for supervisor verification. Verify your email, then sign in to your washer dashboard. After the supervisor approves it, you can choose to go online and receive eligible jobs.");
        return;
      }
      if (accountType !== "customer") {
        setSuccess("Registration received. Verify your email if prompted, then contact your administrator to activate " + accountType + " access. Account ID: " + (data.user?.id || "Available from your profile after verification"));
        return;
      }
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
      address={address} setAddress={setAddress} locationBusy={locationBusy} setLocationBusy={setLocationBusy}
      accountType={accountType}
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
