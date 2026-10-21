import { useEffect, useState } from "react";
import { getSupervisorWasherRoster } from "../../services/supervisorService";
import SupervisorWasherRoster from "./SupervisorWasherRoster";

export default function SupervisorWasherDirectory() {
  const [washers, setWashers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        const result = await getSupervisorWasherRoster();
        if (active) { setWashers(result.washers || []); setError(""); }
      } catch (err) {
        if (active) setError(err.message || "Unable to load washers.");
      } finally { pending = false; if (active) setLoading(false); }
    }
    load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [attempt]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-900">Washers by location</h1><p className="mt-2 text-slate-600">Find all registered washers in a city, area or postal code, including offline washers and those awaiting verification.</p></div><button onClick={() => setAttempt(value => value + 1)} className="rounded-xl border bg-white px-4 py-3 font-semibold">Refresh</button></div>
    <SupervisorWasherRoster washers={washers} loading={loading} error={error} onRetry={() => setAttempt(value => value + 1)} />
  </div>;
}
