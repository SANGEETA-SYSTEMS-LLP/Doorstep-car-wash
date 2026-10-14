import { Mail, Phone, User } from "lucide-react";
import Field from "./Field";
import PasswordField from "./PasswordField";

function RegistrationFields({ form, handleChange, showPassword, setShowPassword, showConfirm, setShowConfirm, loading, error, success }) {
  return (
    <form onSubmit={form.handleSubmit} className="mt-8 space-y-5">
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{success}</div>}
      <Field label="Full name" icon={<User size={19} />} type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mobile number" icon={<Phone size={19} />} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
        <Field label="Email address" icon={<Mail size={19} />} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField label="Password" name="password" value={form.password} onChange={handleChange} visible={showPassword} setVisible={setShowPassword} />
        <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} visible={showConfirm} setVisible={setShowConfirm} />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-500">
        <input type="checkbox" required className="mt-1 h-4 w-4" />
        <span>
          I agree to the <button type="button" className="font-semibold text-blue-600">Terms of Service</button>
          {" "}and{" "}
          <button type="button" className="font-semibold text-blue-600">Privacy Policy</button>.
        </span>
      </label>
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}

export default RegistrationFields;
