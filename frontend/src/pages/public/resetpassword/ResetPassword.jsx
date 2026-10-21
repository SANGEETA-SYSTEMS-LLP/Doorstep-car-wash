import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../services/auth/supabase";

export default function ResetPassword() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSaved(true);
      setPassword("");
      setConfirmation("");
    } catch (err) {
      setError(err.message || "Unable to update password. Request a new reset link.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Set a new password</h1>
        {loading ? <p role="status" className="mt-5">Checking your reset link...</p> : saved ? (
          <div className="mt-5"><p role="status">Your password has been updated.</p><Link className="mt-4 block text-blue-700 underline" to="/dashboard">Continue to your account</Link></div>
        ) : !user ? (
          <div className="mt-5"><p role="alert">Your reset link is missing or expired.</p><Link className="mt-4 block text-blue-700 underline" to="/forgot-password">Request a new reset link</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            {error && <p role="alert" className="text-red-700">{error}</p>}
            <label className="block text-sm font-semibold">New password
              <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" />
            </label>
            <label className="block text-sm font-semibold">Confirm password
              <input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" />
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Update password"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
