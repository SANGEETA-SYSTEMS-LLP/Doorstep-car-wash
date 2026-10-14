import { Link } from "react-router-dom";
import { ArrowLeft, Car } from "lucide-react";
import LoginCredentialsForm from "./LoginCredentialsForm";

function LoginForm({ showPassword, setShowPassword, email, setEmail, password, setPassword, handleSubmit, loading, error }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Car size={24} />
              </div>

              <div>
                <p className="text-xl font-bold">WashNow</p>
                <p className="text-xs text-slate-500">
                  Doorstep Car Care
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-blue-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Login to your account
            </h2>

            <p className="mt-3 text-slate-500">
              Enter your details to manage your bookings and car
              care services.
            </p>
          </div>

          <LoginCredentialsForm
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
            loading={loading}
            error={error}
          />

          <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}

export default LoginForm;
