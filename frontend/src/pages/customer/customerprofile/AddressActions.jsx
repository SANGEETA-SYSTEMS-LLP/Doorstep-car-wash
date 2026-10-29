import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import SignupAddress from "../../public/register/SignupAddress";
import { updateSavedAddress, deleteSavedAddress } from "../../../services/locations/locationService";
export default function AddressActions({ address, userId }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  function edit() {
    setDraft({label: address.label, address: address.address_line, latitude: address.latitude, longitude: address.longitude, city: address.city, state: address.state, postalCode: address.postal_code, flatNumber: address.flat_number, tower: address.tower, landmark: address.landmark});
    setError(""); setEditing(true);
  }
  async function persist(event) {
    event.preventDefault(); if (saving || locating) return;
    if (draft.postalCode && !/^\d{6}$/.test(draft.postalCode)) { setError("Enter a valid 6-digit PIN code."); return; }
    setSaving(true); setError("");
    try { await updateSavedAddress(userId, address.id, draft); setEditing(false); window.dispatchEvent(new Event("customer-address-saved")); }
    catch (failure) { setError(failure.message || "Unable to update address."); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (saving || !window.confirm("Remove this saved address? Past bookings will keep their saved location details.")) return;
    setSaving(true); setError("");
    try { await deleteSavedAddress(userId, address.id); window.dispatchEvent(new Event("customer-address-saved")); }
    catch (failure) { setError(failure.message || "Unable to delete address."); }
    finally { setSaving(false); }
  }
  return <div className="mt-4 border-t border-slate-100 pt-3">
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    {editing ? <form onSubmit={persist} className="space-y-4">
      <label className="block text-sm font-medium">Address label<input value={draft.label || ""} maxLength={60} disabled={saving || locating} onChange={event => setDraft({...draft,label:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"/></label>
      <SignupAddress value={draft} onChange={setDraft} disabled={saving} onBusy={setLocating}/>
      <label className="block text-sm font-medium">Tower / block<input value={draft.tower || ""} maxLength={100} disabled={saving || locating} onChange={event => setDraft({...draft,tower:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3"/></label>
      <div className="flex flex-wrap gap-3"><button disabled={saving || locating} className="rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button><button type="button" disabled={saving || locating} onClick={() => {setEditing(false);setError("");}} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">Cancel</button></div>
    </form> : <div className="flex gap-4"><button type="button" onClick={edit} disabled={saving} className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-green-700"><Pencil size={16}/>Edit</button><button type="button" onClick={remove} disabled={saving} className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 size={16}/>{saving ? "Removing…" : "Remove"}</button></div>}
  </div>;
}
