import {
  useAuth,
} from "../../context/AuthContext";

export default function SupervisorProfile() {
  const {
    user,
    profile,
  } = useAuth();

  return (
    <div className="space-y-6">
      <header>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Account settings</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Supervisor Profile
      </h1>
      <p className="mt-3 text-sm text-slate-600">Your account details and workspace access.</p>
      </header>

      <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.025]">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5"><p className="text-sm font-bold text-slate-900">Profile information</p><p className="mt-1 text-xs text-slate-500">Details associated with your signed-in account.</p></div>
        <div className="grid gap-0 sm:grid-cols-2">
          <div>
            <p className="border-b border-slate-100 p-5 text-xs font-bold uppercase tracking-wide text-slate-400 sm:border-r">
              Full Name
              <span className="mt-2 block text-sm font-semibold normal-case tracking-normal text-slate-900">
              {profile?.full_name ||
                "-"}
              </span>
            </p>
          </div>

          <div>
            <p className="border-b border-slate-100 p-5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Email
              <span className="mt-2 block break-all text-sm font-semibold normal-case tracking-normal text-slate-900">
              {user?.email ||
                "-"}
              </span>
            </p>
          </div>

          <div>
            <p className="border-b border-slate-100 p-5 text-xs font-bold uppercase tracking-wide text-slate-400 sm:border-b-0 sm:border-r">
              Phone
              <span className="mt-2 block text-sm font-semibold normal-case tracking-normal text-slate-900">
              {profile?.phone ||
                "-"}
              </span>
            </p>
          </div>

          <div>
            <p className="p-5 text-xs font-bold uppercase tracking-wide text-slate-400">
              Role
              <span className="mt-2 block text-sm font-semibold capitalize normal-case tracking-normal text-blue-800">
              {profile?.role ||
                "supervisor"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
