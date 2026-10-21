import { useState } from "react";
import {
  Check,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/apiClient";
import { referenceId } from "../../services/referenceId";

export default function AccountProfile({ children, customerView = false, notice }) {
  const { data, error, loading, refresh } = useApi("/account/profile");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Account settings
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            My profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep your contact details up to date so we can share booking updates
            and reach you when needed.
          </p>

        </header>
        {notice}

        {loading && (
          <div role="status" className="space-y-5">
            <span className="sr-only">Loading your profile...</span>
            <div className="h-48 animate-pulse rounded-3xl bg-white" />
            <div className="h-96 animate-pulse rounded-3xl bg-white" />
          </div>
        )}

        {!loading && error && (
          <section
            role="alert"
            className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-bold text-slate-900">
              We couldn’t load your profile
            </h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
            >
              Try again
            </button>
          </section>
        )}

        {!loading && !error && data?.profile && (
          <ProfileForm
            key={data.profile.id}
            profile={data.profile}
            refresh={refresh}
            compact={customerView}
          />
        )}
        {children}
      </div>
    </div>
  );
}

function ProfileForm({ profile, refresh, compact = false }) {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const reference = ["customer", "washer"].includes(profile.role)
    ? referenceId(profile.role === "customer" ? "CUS" : "WSH", profile.id)
    : profile.id;
  const initials = (profile.full_name || profile.email || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const roleLabel = (profile.role || "customer").replaceAll("_", " ");

  async function save(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await apiRequest("/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ full_name: name, phone }),
      });
      await refreshProfile();
      refresh();
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "Unable to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? "w-full min-w-0" : "grid w-full min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]"}>
      <aside className="min-w-0 md:sticky md:top-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-800 ring-1 ring-blue-100">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold leading-6 text-slate-950">
                {profile.full_name || "Your name"}
              </h2>
              <p className="mt-1 text-sm capitalize text-slate-500">
                {roleLabel} account
              </p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={15} aria-hidden="true" />
            Account summary
          </div>

          <div className="my-5 border-t border-slate-100" />

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Account details
          </h3>
          <dl className="mt-4 space-y-4">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-slate-500">{compact ? "Customer ID" : "Account ID"}</dt>
              <dd className="mt-1 break-all text-sm font-semibold leading-5 text-slate-800">
                {reference}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Account type</dt>
              <dd className="mt-1 text-sm font-semibold capitalize text-slate-800">
                {roleLabel}
              </dd>
            </div>
          </dl>
        </section>
      </aside>

      {!compact && <div className="min-w-0 space-y-5">
        <form
          id="personal-information"
          onSubmit={save}
          className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound size={21} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-950">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your name and phone number are used for your bookings.
              </p>
            </div>
          </div>

          {saved && (
            <div
              role="status"
              className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              Your profile was saved successfully.
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
            >
              {error}
            </p>
          )}

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Full name
              </span>
              <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <UserRound
                  size={18}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Email address
              </span>
              <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <Mail
                  size={18}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  readOnly
                  value={profile.email || ""}
                  autoComplete="email"
                  className="h-full min-w-0 flex-1 cursor-not-allowed border-0 bg-transparent p-0 text-sm text-slate-600 outline-none ring-0 focus:outline-none focus:ring-0"
                />
                <LockKeyhole
                  size={16}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-1.5 block text-xs text-slate-500">
                Email changes are managed through your sign-in provider.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                Mobile number
              </span>
              <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <Phone
                  size={18}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  required
                  type="tel"
                  minLength={7}
                  maxLength={20}
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Add a phone number"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </span>
            </label>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={saving || !name.trim() || !phone.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving profile...
                </>
              ) : (
                <>
                  <Save size={17} aria-hidden="true" />
                  Save changes
                </>
              )}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check size={16} aria-hidden="true" />
                All changes saved
              </span>
            )}
          </div>
        </form>

        {!compact && <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Your information stays protected
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              We use your contact details to manage your account and coordinate
              your car-wash bookings.
            </p>
          </div>
        </section>}
      </div>}
    </div>
  );
}
