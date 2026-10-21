import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getWasherWorkspace } from "../services/washer/washerWorkspaceService";
import { supabase } from "../services/auth/supabase";

export default function useWasherWorkspace() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [accountUnavailable, setAccountUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => {
    let active = true;
    let pending = false;
    async function load() {
      if (pending || !user) return;
      pending = true;
      try { const result = await getWasherWorkspace(); if (active) { setData({ ...result, sessionUserId: user.id }); setError(""); setErrorStatus(null); setAccountUnavailable(false); } }
      catch (err) { if (active) { setError(err.message); setErrorStatus(err.status || null); setData(null); setAccountUnavailable(err.status === 404); } }
      finally { pending = false; if (active) setLoading(false); }
    }
    load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [user, version]);
  useEffect(() => {
    if (!data?.washer?.id) return;
    const id = data.washer.id;
    const channel = supabase.channel("washer-workspace-" + id)
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_assignments", filter: "washer_id=eq." + id }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: "assigned_washer_id=eq." + id }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [data?.washer?.id, refresh]);
  return { data: data?.sessionUserId === user?.id ? data : null, error, errorStatus, loading, refresh, accountUnavailable };
}
