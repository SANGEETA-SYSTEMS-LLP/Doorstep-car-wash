import { useEffect, useState } from "react";
import { apiRequest } from "../../../api/apiClient";
export default function NearbyWashers({latitude,longitude}) {
  const [state,setState]=useState({loading:true,rows:[],error:""});
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    const abort=new AbortController();setState({loading:true,rows:[],error:""});
    const timer=setTimeout(()=>{
      apiRequest("/account/nearby-washers?"+new URLSearchParams({latitude,longitude}),{signal:abort.signal})
        .then(data=>{if(!abort.signal.aborted)setState({loading:false,rows:data.washers||[],error:""});})
        .catch(error=>{if(!abort.signal.aborted)setState({loading:false,rows:[],error:error.message});});
    },300);
    return()=>{abort.abort();clearTimeout(timer);};
  },[latitude,longitude,revision]);
  return <section className="mt-6 rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-bold">Washers near your location</h2>
    <p className="mt-2 text-sm text-slate-500">Verified washers whose service areas cover your pin. Distances are approximate, based on their last saved or reported location. Assignment depends on availability, skills and your booking time.</p>
    {state.loading&&<p role="status" className="mt-4">Finding nearby washers…</p>}
    {state.error&&<p role="alert" className="mt-4 text-red-700">{state.error} <button type="button" className="underline" onClick={()=>setRevision(n=>n+1)}>Retry</button></p>}
    {!state.loading&&!state.error&&!state.rows.length&&<p className="mt-4 text-slate-600">No verified washers currently have a saved location covering this pin. You can continue booking; assignment will be checked separately.</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{state.rows.map(washer=><article key={washer.id} className="rounded-xl border p-4">
      <h3 className="font-bold">{washer.name}</h3><span className="text-xs font-semibold text-green-700">Verified washer</span>
      <p className="mt-2 text-sm">Approximately {washer.distanceKm} km away · {washer.jobsCompleted||0} completed jobs</p>
      <p className="mt-1 text-sm text-slate-600">{Number(washer.rating)>0?`${Number(washer.rating).toFixed(1)} / 5 rating` : "No ratings yet"} · {washer.status==="available"?"Online":washer.status==="busy"?"On a job":"Offline"}</p>
      {washer.locationUpdatedAt&&<p className="mt-2 text-xs text-slate-500">Location updated {new Date(washer.locationUpdatedAt).toLocaleString("en-IN")}</p>}
    </article>)}</div>
  </section>;
}
