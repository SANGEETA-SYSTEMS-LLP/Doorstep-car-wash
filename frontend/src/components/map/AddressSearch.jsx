import { useRef, useState, useEffect } from "react";
import { searchAddresses } from "../../services/locations/maps";
export default function AddressSearch({onSelect,onStart,onError,disabled=false}) {
 const [query,setQuery]=useState(""),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++;},[]);
 async function search() {
  if(disabled || busy || query.trim().length<3)return;
  const id=++sequence.current;setBusy(true);setError("");setResults([]);
  try { const data=await searchAddresses(query.trim());if(id===sequence.current){setResults(data);if(!data.length)setError("No addresses found. Try a nearby street or use current location.");} }
  catch(e){if(id===sequence.current)setError(e.message);}
  finally{if(id===sequence.current)setBusy(false);}
 }
 return <div>
  <label className="block text-sm font-semibold text-slate-800">Search address, apartment or office<div className="mt-2 flex gap-2"><input disabled={disabled || busy} value={query} onChange={e=>{setQuery(e.target.value);setResults([]);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();search();}}} placeholder="Apartment, society, office, landmark or street" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3"/><button type="button" disabled={disabled || busy || query.trim().length<3} onClick={search} className="rounded-xl bg-blue-700 px-4 text-sm text-white disabled:opacity-50">{busy?"Searching…":"Search"}</button></div></label>
  {error && <p role="alert" className="mt-2 text-sm text-amber-800">{error}</p>}
  <ul className="mt-2 max-h-64 overflow-auto">{results.map((address,index)=><li key={`${address.latitude},${address.longitude},${index}`}><button type="button" disabled={disabled} className="w-full border-b border-slate-100 px-3 py-3 text-left text-sm hover:bg-blue-50" onClick={()=>{const id=onStart?.();try{onSelect({lat:address.latitude,lng:address.longitude},address,id);setResults([]);setQuery(address.address||address.name);}catch(e){onError?.(e.message,id);}}}><span className="block font-semibold text-slate-900">{address.address||address.name}</span>{address.name&&address.name!==address.address&&<span className="mt-1 block text-slate-600">{address.name}</span>}</button></li>)}</ul>
  <p className="mt-2 text-xs text-slate-500">Search a public place or street and select a result to show it on the map. Enter private flat details separately. © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
 </div>;
}
