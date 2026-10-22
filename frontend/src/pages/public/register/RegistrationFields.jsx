import SignupAddress from "./SignupAddress";
import { Mail, Phone, User } from "lucide-react";
import Field from "./Field";
import PasswordField from "./PasswordField";

function RegistrationFields({ accountType, address, setAddress, locationBusy, setLocationBusy, form, handleChange, showPassword, setShowPassword, showConfirm, setShowConfirm, loading, error, success }) {
  return (
    <form onSubmit={form.handleSubmit} className="mt-8 space-y-5">
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
      {success && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{success}</div>}
      <div className="border-b border-slate-100 pb-3"><h3 className="text-sm font-semibold text-slate-950">Personal details</h3><p className="mt-1 text-xs leading-5 text-slate-500">How our team can reach you about your application.</p></div>
      <Field label="Full name" icon={<User size={19} />} type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <Field label="Mobile number" icon={<Phone size={19} />} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
        <Field label="Email address" icon={<Mail size={19} />} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
      </div>
      <div className="grid items-start gap-5 sm:grid-cols-2">
        <div className="border-b border-slate-100 pb-3 sm:col-span-2"><h3 className="text-sm font-semibold text-slate-950">Account security</h3><p className="mt-1 text-xs leading-5 text-slate-500">Choose a password you can use to sign in to your washer account.</p></div>
        <PasswordField label="Password" name="password" value={form.password} onChange={handleChange} visible={showPassword} setVisible={setShowPassword} />
        <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} visible={showConfirm} setVisible={setShowConfirm} />
      </div>
      {["customer", "washer"].includes(accountType) && <SignupAddress value={address} onChange={setAddress} disabled={loading} onBusy={setLocationBusy} accountType={accountType} />}
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-700 focus:ring-blue-600" />
        <span>
          I agree to the <button type="button" className="font-semibold text-blue-700 hover:text-blue-900">Terms of Service</button>
          {" "}and{" "}
          <button type="button" className="font-semibold text-blue-700 hover:text-blue-900">Privacy Policy</button>.
        </span>
      </label>
      <button type="submit" disabled={loading || locationBusy} className="w-full rounded-xl bg-[#173b64] py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#102b49] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Submitting application…" : accountType === "washer" ? "Submit washer application" : "Create Account"}
      </button>
    </form>
  );
}

export default RegistrationFields;
