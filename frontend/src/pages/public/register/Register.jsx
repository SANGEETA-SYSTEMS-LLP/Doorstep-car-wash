import { validPostalAddress, validServiceAddress } from "../../../services/locations/locationSelection";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { apiRequest } from "../../../services/core/api";
import { loginErrorMessage } from "../../../services/auth/authTransport";
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
    if (form.password.length < 8 || form.password.length > 128) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    const hasAddressInput = Object.values(address).some(value => value != null && String(value).trim() !== "");
    const postalAddressComplete = validPostalAddress(address);
    const serviceAddressComplete = validServiceAddress(address) && postalAddressComplete;
    if (accountType === "washer" && !serviceAddressComplete) {
      setError("Washer signup requires a selected map location, complete street address, city, state and 6-digit PIN code for supervisor verification.");
      return;
    }
    if (accountType === "customer" && hasAddressInput && !postalAddressComplete) {
      setError("Enter a complete street address (at least 10 characters), city, state and 6-digit PIN code, or clear the optional address. Map location is optional.");
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
        signupAddress: accountType === "customer" && postalAddressComplete
          ? address
          : accountType === "washer" && serviceAddressComplete ? address : null,
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
      if (accountType === "supervisor") {
        if (data.session) {
          navigate("/dashboard");
        } else {
          setSuccess("Supervisor account created. Please verify your email, then sign in to open your supervisor dashboard.");
        }
        return;
      }
      if (data.session) {
        navigate("/customer");
        return;
      }
      setSuccess("Account created. Please check your email to verify your account.");
    } catch (error) {
      setError(loginErrorMessage(error));
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
