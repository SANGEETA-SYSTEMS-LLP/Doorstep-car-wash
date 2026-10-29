import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { WashNowBrand } from "../../../components/layout/WashNowBrand";
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
            <WashNowBrand />
          </div>

          <div>
            <p className="font-semibold text-green-600">
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
                className="font-semibold text-green-600 hover:text-green-700"
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
