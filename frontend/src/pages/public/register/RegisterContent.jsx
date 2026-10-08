import { Link } from "react-router-dom";
import { ArrowLeft, Car, Mail, Phone, User } from "lucide-react";
import Field from "./Field";
import PasswordField from "./PasswordField";
import Process from "./Process";

function RegisterContent({ showPassword, setShowPassword, showConfirm, setShowConfirm, form, handleChange, handleSubmit }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
      {/* Branding */}

      <div className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-12 text-white lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <Car />
          </div>

          <div>
            <p className="text-xl font-bold">WashNow</p>
            <p className="text-xs text-blue-200">
              Doorstep Car Care
            </p>
          </div>
        </Link>

        <div className="my-auto">
          <p className="font-semibold text-blue-300">
            GET STARTED
          </p>

          <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight">
            Professional car care at your doorstep.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
            Create your account, add your vehicle and book your
            first doorstep wash in minutes.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-blue-200">
              BOOKING PROCESS
            </p>

            <div className="mt-5 space-y-5">
              <Process number="01" text="Choose your location" />
              <Process number="02" text="Add your vehicle" />
              <Process number="03" text="Select a wash package" />
              <Process number="04" text="Choose date and time" />
              <Process number="05" text="Track your washer" />
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Car />
              </div>

              <p className="text-xl font-bold">WashNow</p>
            </div>
          </div>

          <p className="font-semibold text-blue-600">
            CREATE ACCOUNT
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Start your car-care journey
          </h2>

          <p className="mt-3 text-slate-500">
            Enter your information to create your customer account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field
              label="Full name"
              icon={<User size={19} />}
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Mobile number"
                icon={<Phone size={19} />}
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />

              <Field
                label="Email address"
                icon={<Mail size={19} />}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                visible={showPassword}
                setVisible={setShowPassword}
              />

              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                visible={showConfirm}
                setVisible={setShowConfirm}
              />
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-slate-500">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4"
              />

              <span>
                I agree to the{" "}
                <button
                  type="button"
                  className="font-semibold text-blue-600"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="font-semibold text-blue-600"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Create Account
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterContent;
