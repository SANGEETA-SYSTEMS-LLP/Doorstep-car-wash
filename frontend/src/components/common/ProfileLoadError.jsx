import { useAuth } from "../../context/AuthContext";

export default function ProfileLoadError() {
  const { profileError, refreshProfile, logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center" role="alert">
        <h2 className="text-xl font-bold">Unable to load your profile</h2>
        <p className="mt-2 text-sm text-slate-500">
          {profileError || "Your account profile is unavailable. Please retry or sign in again."}
        </p>
        <div className="mt-5 flex justify-center gap-4">
          <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => refreshProfile()}>Retry</button>
          <button className="rounded border px-4 py-2" onClick={() => logout().catch(() => {})}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
