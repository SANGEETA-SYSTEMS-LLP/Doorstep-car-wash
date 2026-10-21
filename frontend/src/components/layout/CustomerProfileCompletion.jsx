import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSavedAddresses, saveServiceAddress } from "../../services/locationService";
import { validServiceAddress } from "../../services/locationSelection";
import SignupAddress from "../../pages/public/register/SignupAddress";

export default function CustomerProfileCompletion({ embedded = false }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const onProfile = pathname === "/customer/profile";
  const visible = onProfile || pathname === "/customer" || pathname === "/customer/";
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  const [address, setAddress] = useState({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!visible || !user?.id) return;
    let active = true;
    setStatus("loading");
    getSavedAddresses(user.id).then(rows => {
      if (active) setStatus(rows.some(row => validServiceAddress({ address: row.address_line, latitude: row.latitude, longitude: row.longitude })) ? "complete" : "missing");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [user?.id, pathname, visible, retry]);
  useEffect(() => {
    const refresh = () => setRetry(value => value + 1);
    window.addEventListener("customer-address-saved", refresh);
    return () => window.removeEventListener("customer-address-saved", refresh);
  }, []);
  async function save(event) {
    event.preventDefault();
    if (saving || busy) return;
    setError("");
    if (!validServiceAddress(address) || !address.city?.trim() || !address.state?.trim() || !/^\d{6}$/.test(address.postalCode || "")) {
      setError("Select your location and enter a complete street address, city, state and 6-digit PIN code."); return;
    }
    setSaving(true);
    try {
      await saveServiceAddress(user.id, address, address);
      window.dispatchEvent(new Event("customer-address-saved"));
      setStatus("complete"); setSaved(true); setAddress({});
    } catch (failure) { setError(failure.message || "Unable to save your address. Please try again."); }
    finally { setSaving(false); }
  }
  if ((!embedded && onProfile) || !visible || status === "loading") return null;
  if (status === "complete") return saved && onProfile ? <p role="status" className="m-4 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-800 sm:m-6"><CheckCircle2 size={18}/>Your address is saved. Your address information is complete.</p> : null;
  if (status === "error" && embedded) return null;
  if (status === "error") return <div role="alert" className="m-4 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:m-6">Unable to check your saved address. <button type="button" onClick={() => setRetry(value => value + 1)} className="font-semibold text-blue-700 underline">Try again</button></div>;
  return <section aria-labelledby="complete-profile-title" className={embedded ? "mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:p-6" : "m-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:m-6 sm:p-6"}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><MapPin size={22}/></span><div><h2 id="complete-profile-title" className="text-lg font-semibold text-slate-900">Complete your profile</h2><p className="mt-1 text-sm leading-6 text-slate-500">Add your service address for easier bookings. You can continue using your account meanwhile.</p></div></div>
      {!onProfile && <Link to="/customer/profile" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Add address <ArrowRight size={16}/></Link>}
    </div>
    {onProfile && <form onSubmit={save} className="mt-5 max-w-2xl space-y-4">
      <SignupAddress value={address} onChange={setAddress} disabled={saving} onBusy={setBusy}/>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving || busy} type="submit" className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto">{saving ? "Saving address…" : "Save address"}</button>
    </form>}
  </section>;
}
