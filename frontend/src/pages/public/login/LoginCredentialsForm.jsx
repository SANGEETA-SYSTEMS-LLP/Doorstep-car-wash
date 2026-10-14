import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

function LoginCredentialsForm({ showPassword, setShowPassword, email, setEmail, password, setPassword, handleSubmit, loading, error }) {
  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
        <div className="relative">
          <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-12 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
        Remember me
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Signing In..." : "Login"}
      </button>
    </form>
  );
}

export default LoginCredentialsForm;
