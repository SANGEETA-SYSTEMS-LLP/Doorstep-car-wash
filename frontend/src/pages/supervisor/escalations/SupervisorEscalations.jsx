import {
  useEffect,
  useState,
} from "react";
import {
  getSupervisorEscalations,
} from "../../../services/supervisor/supervisorService";
import EscalationCard from "./EscalationCard";

export default function SupervisorEscalations() {
  const [
    escalations,
    setEscalations,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    const load =
      async () => {
        try {
          const data =
            await getSupervisorEscalations();

          setEscalations(
            data.escalations ||
              []
          );
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

    load();
  }, []);

  if (loading) {
    return <div role="status" className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500">Loading escalations...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-amber-200 bg-[#fbfaf5] p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Operations attention</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        No-washer escalations
      </h1>

      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Bookings where automatic
        assignment could not find a
        suitable washer.
      </p>
      </header>

      <div className="space-y-4">
        {escalations.map((booking) => (
          <EscalationCard key={booking.id} booking={booking} />
        ))}

        {!escalations.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No assignment escalations.
          </div>
        )}
      </div>
    </div>
  );
}
