import { Bell, Camera, CheckCircle2, Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import ProfileInput from "./ProfileInput";
import Preference from "./Preference";

function CustomerProfileContent({ saved, saving, error, emailVerified, profile, handleChange, saveProfile }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="font-semibold text-green-600">
          ACCOUNT
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          My Profile
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your personal information and preferences.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.65fr_1.35fr]">
          <aside>
            <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center">
              <div className="relative mx-auto w-fit">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <UserRound size={48} />
                </div>

                <button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white shadow">
                  <Camera size={16} />
                </button>
              </div>

              <h2 className="mt-5 text-xl font-bold">
                {profile.fullName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customer
              </p>

              <div className={`mt-6 rounded-xl p-3 text-sm font-semibold ${emailVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {emailVerified ? "Email verified" : "Email verification pending"}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <form
              onSubmit={saveProfile}
              className="rounded-3xl border border-slate-200 bg-white p-7"
            >
              <h2 className="text-xl font-bold">
                Personal Information
              </h2>

              {saved && (
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                  <CheckCircle2 size={18} />
                  Profile updated successfully.
                </div>
              )}
              {error && (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 space-y-5">
                <ProfileInput
                  icon={<UserRound />}
                  label="Full Name"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                />

                <ProfileInput
                  icon={<Mail />}
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  readOnly
                />

                <ProfileInput
                  icon={<Phone />}
                  label="Mobile Number"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-7 flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white disabled:cursor-wait disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-7">
              <h2 className="text-xl font-bold">
                Preferences
              </h2>

              <div className="mt-5 divide-y divide-slate-100">
                <Preference
                  icon={<Bell />}
                  title="Booking Notifications"
                  description="Receive booking and service updates."
                />

                <Preference
                  icon={<MapPin />}
                  title="Location Updates"
                  description="Receive washer arrival and tracking updates."
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerProfileContent;
