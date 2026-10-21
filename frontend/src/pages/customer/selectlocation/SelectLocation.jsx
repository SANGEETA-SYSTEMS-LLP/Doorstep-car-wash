import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookingSteps from "../../../components/booking/BookingSteps";
import NearbyWashers from "./NearbyWashers";
import ServiceMap from "../../../components/map/ServiceMap";
import AddressSearch from "../../../components/map/AddressSearch";
import { useBooking } from "../../../context/BookingContext";
import { useAuth } from "../../../context/AuthContext";
import { coordinates, currentPosition, reverseGeocode } from "../../../services/maps";
import { checkCoverage, getSavedAddresses, saveServiceAddress } from "../../../services/locationService";
import { pinLocation, resolveLocationSelection, validServiceAddress } from "../../../services/locationSelection";

export default function SelectLocation() {
  const { booking, updateBooking, updateAddress } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState(() => coordinates(booking.location) ? booking.location : null);
  const [coverage, setCoverage] = useState(null);
  const [address, setAddress] = useState(booking.address || {});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedError, setSavedError] = useState("");
  const request = useRef(0);
  const edited = useRef(false);
  const saveLock = useRef(false);
  const initialLocation = useRef(booking.location);

  useEffect(() => {
    let active = true;
    getSavedAddresses(user.id).then(rows => { if (active) setSavedAddresses(rows); }).catch(() => { if (active) setSavedError("Saved addresses could not be loaded. You can still select a new location."); });
    const id = request.current;
    if (coordinates(initialLocation.current)) checkCoverage(initialLocation.current).then(result => {
      if (active && id === request.current) setCoverage(result);
    }).catch(err => { if (active && id === request.current) setError(err.message); });
    return () => { active = false; request.current += 1; };
  }, [user.id]);

  function begin() {
    const id = ++request.current;
    edited.current = false;
    setBusy(true); setError(""); setNotice(""); setCoverage(null);
    return id;
  }
  async function applyPosition(position, resolvedAddress, id) {
    try {
      const pin = pinLocation(position);
      setLocation(resolvedAddress ? { ...resolvedAddress, ...pin, address: resolvedAddress.address, name: resolvedAddress.name, city: resolvedAddress.city, state: resolvedAddress.state, postalCode: resolvedAddress.postalCode } : pin);
      const result = await resolveLocationSelection(position, resolvedAddress, { lookup: reverseGeocode, coverage: checkCoverage });
      if (id !== request.current) return;
      if (!edited.current) setLocation(result.location);
      setCoverage(result.coverage); setNotice(result.notice); setError(result.error);
    } catch (err) { if (id === request.current) setError(err.message); }
    finally { if (id === request.current) setBusy(false); }
  }
  function selectPosition(position, resolvedAddress, selectionId) {
    if (saveLock.current || (selectionId !== undefined && selectionId !== request.current)) return;
    return applyPosition(position, resolvedAddress, selectionId ?? begin());
  }
  async function locate() {
    if (saveLock.current) return;
    const id = begin();
    try {
      const position = await currentPosition();
      if (id === request.current) await applyPosition(position, undefined, id);
    } catch (err) { if (id === request.current) { setError(err.message); setBusy(false); } }
  }
  function editLocation(key, value) {
    edited.current = true;
    setLocation(previous => ({ ...previous, [key]: value, ...(key === "address" ? { name: value, placeId: null } : {}) }));
  }
  function selectSavedAddress(id) {
    const saved = savedAddresses.find(row => row.id === id);
    if (!saved || saveLock.current) return;
    setAddress({ tower: saved.tower || "", flatNumber: saved.flat_number || "", landmark: saved.landmark || "" });
    selectPosition(coordinates(saved), { latitude: saved.latitude, longitude: saved.longitude, address: saved.address_line, name: saved.label || saved.address_line, city: saved.city || "", state: saved.state || "", postalCode: saved.postal_code || "", addressId: saved.id });
  }
  async function confirm(event) {
    event.preventDefault();
    if (!coverage?.available || !validServiceAddress(location) || busy || saveLock.current) return;
    saveLock.current = true; setSaving(true); setError("");
    try {
      const selected = { ...location, address: location.address.trim(), name: location.name || location.address.trim() };
      const latest = await checkCoverage(selected);
      if (!latest.available) { setCoverage(latest); throw new Error("Please select a valid map location."); }
      const saved = await saveServiceAddress(user.id, selected, address, latest.society?.id);
      updateBooking({ location: { ...selected, addressId: saved.id }, society: latest.society, serviceZone: latest.zone });
      updateAddress(address);
      navigate("/customer/select-vehicle");
    } catch (err) { setError(err.message); }
    finally { saveLock.current = false; setSaving(false); }
  }
  const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";
  return <div className="min-h-screen bg-slate-50">
    <BookingSteps currentStep={1} />
    <main className="mx-auto max-w-7xl p-5 lg:p-8">
      <h1 className="text-3xl font-bold">Where should we come?</h1>
      <p className="mt-2 text-slate-500">Book in any city or state. Search for your street or building, then select the exact parking location on the map.</p>
      {error && <p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
          <div className="space-y-3 p-4">
            <AddressSearch onSelect={selectPosition} disabled={saving} onStart={begin} onError={(message, id) => { if (id === request.current) { setError(message); setBusy(false); } }} />
            <button type="button" disabled={busy || saving} onClick={locate} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-800 disabled:opacity-50">{busy ? "Checking selected location…" : "Use current location"}</button>
            <p className="text-sm text-slate-500">Choose a suggestion from the list. Typing a city or state alone does not select a service address.</p>
            {savedAddresses.length > 0 && <label className="block text-sm font-semibold">Or use a saved address<select value="" disabled={saving} onChange={e => selectSavedAddress(e.target.value)} className={fieldClass}><option value="">Choose saved address</option>{savedAddresses.filter(row => coordinates(row)).map(row => <option key={row.id} value={row.id}>{row.label && row.label !== row.address_line ? `${row.label} — ${row.address_line}` : row.address_line}</option>)}</select></label>}
            {savedError && <p className="text-sm text-amber-800">{savedError}</p>}
          </div>
          <ServiceMap location={location} onSelect={saving ? undefined : selectPosition} className="h-[420px] rounded-b-2xl sm:h-[500px]" />
          <p className="p-4 text-sm text-slate-500">Click the map to move your service pin. The washer will navigate to this point.</p>
          {coordinates(location) && <NearbyWashers latitude={location.latitude} longitude={location.longitude} />}
        </section>
        <form onSubmit={confirm} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Confirm your service address</h2>
          {!location && <p className="rounded-xl bg-slate-50 p-4 text-slate-600">Select a map point, search suggestion or current location to begin.</p>}
          {notice && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{notice}</p>}
          {location && <p className="text-sm text-slate-600">Pin selected: {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</p>}
          {busy && <p role="status" className="text-sm text-blue-700">Checking address and service availability…</p>}
          {coverage && <div role="status" className={"rounded-xl p-4 text-sm " + (coverage.available ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900")}>
            {coverage.available ? "You can book at this location. Washer assignment depends on nearby availability." : "Please choose a valid location on the map."}
          </div>}
          {location && !coverage && !busy && <button type="button" onClick={() => selectPosition(coordinates(location), location)} className="text-blue-700 underline">Retry availability check</button>}
          <label className="block text-sm font-semibold">Complete street address <span className="text-red-600">*</span><textarea required minLength={10} maxLength={500} rows={3} disabled={!location || saving} value={location?.address || ""} onChange={e => editLocation("address", e.target.value)} placeholder="Building or society, street, area and city" className={fieldClass} /><span className="text-xs font-normal text-slate-500">Make sure this address matches the pin. Moving the pin clears the previous address.</span></label>
          <div className="grid gap-3 sm:grid-cols-2">{[["city", "City"], ["state", "State"], ["postalCode", "PIN code"]].map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input disabled={!location || saving} value={location?.[key] || ""} maxLength={key === "postalCode" ? 6 : 100} pattern={key === "postalCode" ? "[0-9]{6}" : undefined} inputMode={key === "postalCode" ? "numeric" : "text"} onChange={e => editLocation(key,e.target.value)} className={fieldClass}/></label>)}</div>
          {coverage?.society && <p className="text-sm">Society: <strong>{coverage.society.name}</strong></p>}
          {[["tower", "Tower / block (optional)"], ["flatNumber", "Flat / house number (optional)"], ["landmark", "Parking details / landmark (optional)"]].map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input disabled={saving} maxLength={200} value={address[key] || ""} onChange={e => setAddress(previous => ({ ...previous, [key]: e.target.value }))} className={fieldClass} /></label>)}
          <button disabled={!coverage?.available || !validServiceAddress(location) || busy || saving} className="w-full rounded-xl bg-blue-600 p-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving address…" : "Confirm location & continue"}</button>
        </form>
      </div>
    </main>
  </div>;
}
