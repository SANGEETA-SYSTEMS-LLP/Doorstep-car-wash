import { useRef, useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";
import AddressSearch from "../../../components/map/AddressSearch";
import ServiceMap from "../../../components/map/ServiceMap";
import { currentPosition, reverseGeocode } from "../../../services/maps";

export default function SignupAddress({ value, onChange, disabled, onBusy, accountType = "customer" }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const isWasher = accountType === "washer";
  const start = () => { setNotice(""); onBusy(true); return ++sequence.current; };
  const select = (_position, address, id) => {
    if (id !== sequence.current) return;
    onChange({ ...value, ...address }); onBusy(false);
  };
  const locate = async () => {
    const id = start(); setBusy(true);
    try {
      const position = await currentPosition();
      let address = { latitude: position.lat, longitude: position.lng, address: "", city: "", state: "", postalCode: "" };
      try { address = await reverseGeocode(position); }
      catch { if (id === sequence.current) setNotice("Location selected. Enter your complete street address below."); }
      if (id === sequence.current) onChange({ ...value, ...address });
    } catch (error) { if (id === sequence.current) setNotice(error.message); }
    finally { if (id === sequence.current) { setBusy(false); onBusy(false); } }
  };
  return <fieldset disabled={disabled || busy} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
    <legend className="px-2 font-semibold text-slate-900">{isWasher ? "Washer location and address" : "Your service address"} <span className="ml-1 text-xs font-normal text-slate-500">{isWasher ? "Required for verification" : "Optional"}</span></legend>
    <p className="mb-4 text-sm text-slate-500">{isWasher ? "Enter your service location and full address. A supervisor must verify your details before you can go online or receive jobs." : "Save your location for faster booking. You can also add it later."}</p>
    <button type="button" onClick={locate} disabled={disabled || busy} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"><LocateFixed size={20}/>{busy ? "Finding your location…" : "Use my current location"}</button>
    <AddressSearch disabled={disabled || busy} onStart={start} onSelect={select} onError={(message, id) => { if (id === sequence.current) { onBusy(false); setNotice(message); } }}/>
    <ServiceMap location={value} className="mt-4 h-64 rounded-xl"/>
    {notice && <p role="status" className="mt-3 text-sm text-amber-800">{notice}</p>}
    {value.latitude != null && <p className="mt-3 flex items-center gap-2 text-sm text-green-700"><MapPin size={16}/>Location selected ({Number(value.latitude).toFixed(5)}, {Number(value.longitude).toFixed(5)})</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {[['address','Complete street address',500],['flatNumber','Flat / house number',100],['landmark','Landmark (optional)',200],['city','City',100],['state','State',100],['postalCode','PIN code',6]].map(([key,label,max]) => <label key={key} className={key === 'address' ? 'text-sm sm:col-span-2' : 'text-sm'} htmlFor={'signup-'+key}>{label}{isWasher && ['address','city','state','postalCode'].includes(key) && <span className="text-red-600"> *</span>}<input id={'signup-'+key} required={isWasher && ['address','city','state','postalCode'].includes(key)} value={value[key] || ''} maxLength={max} onChange={event => onChange({...value,[key]:event.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>)}
    </div>
    {!isWasher && <button type="button" className="mt-3 text-sm text-slate-600 underline" onClick={() => { sequence.current++; onBusy(false); onChange({}); setNotice(''); }}>Skip / clear address</button>}
  </fieldset>;
}
