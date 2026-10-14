import {
  useAuth,
} from "../../context/AuthContext";

export default function SupervisorProfile() {
  const {
    user,
    profile,
  } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">
        Supervisor Profile
      </h1>

      <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-8">
        <div className="grid gap-6">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Full Name
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {profile?.full_name ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Email
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {user?.email ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Phone
            </p>

            <p className="mt-2 font-bold text-slate-900">
              {profile?.phone ||
                "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Role
            </p>

            <p className="mt-2 font-bold capitalize text-blue-600">
              {profile?.role ||
                "supervisor"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}