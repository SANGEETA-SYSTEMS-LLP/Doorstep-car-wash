import { useRef, useState } from "react";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";
import ServiceMap from "../../../components/map/ServiceMap";
import AddressSearch from "../../../components/map/AddressSearch";
import { currentPosition } from "../../../services/locations/maps";
export default function WasherLocation() {
  const {data,error,loading,refresh}=useApi("/account/washer-location");
  return <section className="mt-6 rounded-3xl border bg-white p-6">
    <h2 className="text-xl font-bold">Location & address</h2>
    <p className="mt-2 text-sm text-slate-600">Set your starting location so customers can find nearby washers. When you go online, live location updates replace this map position. Your full address is not shown in nearby search.</p>
    {loading&&<p className="mt-4">Loading location…</p>}
    {error&&<p role="alert" className="mt-4 text-red-700">{error} <button onClick={refresh} className="underline">Retry</button></p>}
    {data&&!loading&&!error&&<LocationForm initial={data.location} />}
  </section>;
}
function LocationForm({initial}) {
  const [location,setLocation]=useState(initial||{}),[busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false);
  const sequence=useRef(0);
  const select=(point,address)=>{setLocation(previous=>({...previous,...address,latitude:point.lat,longitude:point.lng}));setSaved(false);};
  async function locate(){setBusy(true);setError("");try{select(await currentPosition());}catch(err){setError(err.message);}finally{setBusy(false);}}
  async function save(event){event.preventDefault();if(busy)return;setBusy(true);setError("");setSaved(false);try{
    await apiRequest("/account/washer-location",{method:"PUT",body:JSON.stringify({address:location.address,latitude:location.latitude,longitude:location.longitude})});setSaved(true);
  }catch(err){setError(err.message);}finally{setBusy(false);}}
  return <form onSubmit={save} className="mt-5 space-y-4">
    <fieldset disabled={busy} className="space-y-4">
      <AddressSearch disabled={busy} onStart={()=>++sequence.current} onSelect={(point,address,id)=>{if(id===sequence.current)select(point,address);}} onError={(message,id)=>{if(id===sequence.current)setError(message);}} />
      <button type="button" onClick={locate} className="rounded-xl border px-4 py-3 text-green-700">Use my current location</button>
      <ServiceMap location={location} onSelect={busy?undefined:point=>{++sequence.current;select(point);}} className="h-72 rounded-xl" />
      {location.latitude!=null&&<p className="text-sm text-slate-500">{location.name&&<><span className="font-semibold text-slate-700">Selected place: {location.name}</span><br/></>}Map pin: {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</p>}
      <label className="block text-sm font-semibold">Complete address<textarea required minLength={10} maxLength={500} rows={3} value={location.address||""} onChange={event=>{setLocation({...location,address:event.target.value});setSaved(false);}} className="mt-2 w-full rounded-xl border p-3" /></label>
    </fieldset>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {saved&&<p role="status" className="text-green-700">Address and location saved. Nearby visibility requires an active, verified washer account.</p>}
    <button disabled={busy||location.latitude==null||location.longitude==null} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy?"Please wait…":"Save location & address"}</button>
  </form>;
}
