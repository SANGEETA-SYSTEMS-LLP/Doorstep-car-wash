import { useState } from "react";
import useApi from "../../hooks/useApi";
import { apiRequest } from "../../api/apiClient";
const inputClass="w-full rounded-lg border p-3";
export default function FinanceOperations() {
 const [page,setPage]=useState(1), [kind,setKind]=useState("refund"), [targetId,setTarget]=useState(""), [amount,setAmount]=useState(""), [reason,setReason]=useState("");
 const [pending,setPending]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [account,setAccount]=useState({washerId:"",fundAccountId:"",label:""});
 const {data,error,refresh}=useApi("/finance/operations?page="+page);
 async function perform(path,body,method="POST") {
  setBusy(true);setMessage("");
  try {const result=await apiRequest(path,{method,body:JSON.stringify(body)});setMessage("Saved. " + (result.status || ""));refresh();return result;}
  catch(e){setMessage(e.message);return false;}finally{setBusy(false);}
 }
 async function submit(e){e.preventDefault();if(!pending){const request={id:crypto.randomUUID(),kind,targetId,amount,reason};const result=await perform("/finance/operations",{...request,prepareOnly:true});if(result)setPending({...request,amountPaise:result.amountPaise});return;}if(await perform("/finance/operations",pending)){setPending(null);setTarget("");setReason("");setAmount("");}}
 return <section className="space-y-6"><h1 className="text-2xl font-bold">Refunds and washer payouts</h1>
 <p>Refunds return online payments through Razorpay. Payouts send eligible online-paid earnings through RazorpayX IMPS. Cash collections and bookings with refunds require separate reconciliation.</p>
 {(error||message)&&<p role="status" className="rounded border bg-white p-4">{error||message}</p>}
 <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
 <label>Operation<select disabled={!!pending} className={inputClass} value={kind} onChange={e=>setKind(e.target.value)}><option value="refund">Refund a payment</option><option value="payout">Pay washer earnings</option></select></label>
 <label>{kind==="refund"?"Payment record UUID":"Washer record UUID"}<input required disabled={!!pending} className={inputClass} value={targetId} onChange={e=>setTarget(e.target.value)}/></label>
 {kind==="refund"&&<label>Refund amount (INR)<input required disabled={!!pending} type="number" min="1" step="0.01" className={inputClass} value={amount} onChange={e=>setAmount(e.target.value)}/></label>}
 <label>Reason<input required minLength={3} maxLength={500} disabled={!!pending} className={inputClass} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 {pending&&<p className="md:col-span-2">Review: {pending.kind} · {pending.targetId} · {"INR "+(pending.amountPaise/100).toFixed(2)}. Confirm sends this request to the configured provider. If it times out, retry the same operation below.</p>}
 <button disabled={busy} className="rounded-lg bg-blue-700 p-3 font-bold text-white">{busy?"Processing…":pending?"Confirm and submit":"Review transaction"}</button>
 {pending&&<button type="button" disabled={busy} onClick={async()=>{if(await perform("/finance/operations/"+pending.id+"/cancel",{}))setPending(null);}}>Cancel unsubmitted draft</button>}
 </form>
 <details className="rounded-xl border bg-white p-5"><summary className="cursor-pointer font-bold">Link a washer’s RazorpayX bank fund account</summary><p className="my-3">Create and verify the beneficiary in your RazorpayX dashboard first. Confirm the fund account belongs to this washer before saving.</p><form onSubmit={e=>{e.preventDefault();perform("/finance/payout-account",account,"PUT");}} className="grid gap-3">{[["washerId","Washer UUID"],["fundAccountId","Fund account ID (fa_…)"],["label","Account label (name and last four digits)"]].map(([key,label])=><label key={key}>{label}<input required className={inputClass} value={account[key]} onChange={e=>setAccount({...account,[key]:e.target.value})}/></label>)}<button disabled={busy} className="rounded bg-slate-800 p-3 text-white">Verify and link fund account</button></form></details>
 <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Reference","Type / target","INR","Status","Action"].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{data?.rows.map(row=><tr key={row.id} className="border-t"><td className="p-3 break-all">{row.id}<br/>{row.provider_id}</td><td className="p-3">{row.kind}<br/>{row.payment_id||row.washer_id}</td><td className="p-3">{(row.amount_paise/100).toFixed(2)}</td><td className="p-3">{row.status} / {row.provider_status||"awaiting provider"}</td><td className="p-3"><button disabled={busy} onClick={()=>perform("/finance/operations/"+row.id+"/reconcile",{})} className="text-blue-700 underline">{row.provider_id?"Refresh status":row.status==="reserved"?"Submit reviewed draft":"Retry same request"}</button>{row.status==="reserved"&&<button disabled={busy} onClick={()=>perform("/finance/operations/"+row.id+"/cancel",{})} className="ml-3 text-red-700 underline">Cancel draft</button>}</td></tr>)}</tbody></table></div>
 <div className="flex gap-4"><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page}</span><button disabled={!data||page*25>=data.count} onClick={()=>setPage(page+1)}>Next</button></div></section>;
}
