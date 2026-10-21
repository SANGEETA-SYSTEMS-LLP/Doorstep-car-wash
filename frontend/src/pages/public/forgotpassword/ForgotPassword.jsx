import { supabase } from "../../../services/auth/supabase";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
} from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowLeft size={17} />
          Back to login
        </Link>

        {!sent ? (
          <>
            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <KeyRound size={27} />
            </div>

            <h1 className="mt-6 text-3xl font-bold">
              Forgot password?
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              Enter your email address and we'll send you
              instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
              {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
              <label className="mb-2 block text-sm font-semibold">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={32} />
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Check your email
            </h2>

            <p className="mt-3 text-slate-500">
              If an account exists for this address, you’ll receive reset instructions at
            </p>

            <p className="mt-1 font-semibold">{email}</p>

            <Link
              to="/login"
              className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;