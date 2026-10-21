import { useState } from "react";
import { apiRequest } from "../../../api/apiClient";
import CustomerProfileCompletion from "../../../components/layout/CustomerProfileCompletion";
import SavedCustomerDetails from "./SavedCustomerDetails";
import { useAuth } from "../../../context/AuthContext";
import useApi from "../../../hooks/useApi";
import { referenceId } from "../../../services/referenceId";

export default function CustomerProfile() {
  const { user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({full_name: "", phone: ""});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const { data, error, loading, refresh } = useApi("/account/profile");
  const profile = data?.profile;
  const initials = (profile?.full_name || "Customer").trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      await apiRequest("/account/profile", {method: "PATCH", body: JSON.stringify({full_name: draft.full_name.trim(), phone: draft.phone.trim()})});
      setEditing(false); setSaved(true);
      await refreshProfile(); refresh();
    } catch (failure) { setSaveError(failure.message || "Unable to update profile. Please try again."); }
    finally { setSaving(false); }
  }
  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-slate-950">My profile</h1>
      {loading ? <p role="status" className="rounded-2xl bg-white p-6">Loading your profile…</p> : error ? <div role="alert" className="rounded-2xl bg-white p-6 text-red-700"><p>{error}</p><button type="button" onClick={refresh} className="mt-3 underline">Try again</button></div> : profile && <section aria-label="Customer account summary" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-800">{initials}</div><div><h2 className="break-words text-xl font-bold text-slate-950">{profile.full_name || "Customer"}</h2><p className="mt-1 text-sm text-slate-500">Customer account</p></div></div>
        {saved && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">Profile updated successfully.</p>}
        {saveError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
        {editing ? <form onSubmit={save} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <p className="break-all text-sm text-slate-500">Customer ID: {referenceId("CUS",profile.id)}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Full name<input autoFocus required minLength={2} maxLength={120} autoComplete="name" disabled={saving} value={draft.full_name} onChange={event => setDraft({...draft,full_name:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
            <label className="text-sm font-medium text-slate-700">Mobile number<input required type="tel" minLength={7} maxLength={20} pattern="[+()0-9 \-]{7,20}" autoComplete="tel" disabled={saving} value={draft.phone} onChange={event => setDraft({...draft,phone:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"/></label>
          </div>
          <p className="break-words text-sm text-slate-500">Email: {profile.email || "Not provided"}. Email cannot be changed here.</p>
          <div className="flex flex-wrap gap-3"><button disabled={saving || !draft.full_name.trim() || !draft.phone.trim()} type="submit" className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button><button disabled={saving} type="button" onClick={() => {setEditing(false);setSaveError("");}} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold">Cancel</button></div>
        </form> : <><dl className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
          {[["Customer ID",referenceId("CUS",profile.id)],["Account type","Customer"],["Email address",profile.email],["Mobile number",profile.phone]].map(([label,value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "Not provided"}</dd></div>)}
        </dl><button type="button" onClick={() => {setDraft({full_name: profile.full_name || "",phone: profile.phone || ""});setEditing(true);setSaved(false);setSaveError("");}} className="mt-6 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Edit profile</button></>}
      </section>}
      <div className="mt-6"><CustomerProfileCompletion key={user?.id || "guest"} embedded/></div>
      <SavedCustomerDetails key={user?.id || "guest"}/>
    </div>
  </div>;
}
