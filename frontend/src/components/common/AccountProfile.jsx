import { useState } from "react";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/apiClient";
import { referenceId } from "../../services/referenceId";
export default function AccountProfile() {
  const { data, error, loading, refresh } = useApi("/account/profile");
  return <main className="mx-auto max-w-3xl p-5 lg:p-8"><h1 className="mb-6 text-3xl font-bold">My profile</h1>{loading && <p role="status">Loading profile...</p>}{error && <p role="alert" className="text-red-700">{error}</p>}{data && <ProfileForm key={data.profile.id} profile={data.profile} refresh={refresh} />}</main>;
}
function ProfileForm({ profile, refresh }) {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const reference = ["customer", "washer"].includes(profile.role) ? referenceId(profile.role === "customer" ? "CUS" : "WSH", profile.id) : profile.id;
  async function save(event) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setSaved(false); setError("");
    try { await apiRequest("/account/profile", { method: "PATCH", body: JSON.stringify({ full_name: name, phone }) }); await refreshProfile(); refresh(); setSaved(true); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"><p className="break-all text-xs text-slate-500">Account ID: {reference}</p><p className="text-sm capitalize">Role: {profile.role.replaceAll("_", " ")}</p><label className="block text-sm font-semibold">Name<input required maxLength={150} value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label><label className="block text-sm font-semibold">Phone<input required type="tel" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label><label className="block text-sm font-semibold">Email<input readOnly value={profile.email || ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" /></label><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>{saved && <p role="status" className="text-green-700">Profile saved.</p>}{error && <p role="alert" className="text-red-700">{error}</p>}</form>;
}
