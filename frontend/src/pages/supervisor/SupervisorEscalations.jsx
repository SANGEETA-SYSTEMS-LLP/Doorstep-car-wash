import {
  useEffect,
  useState,
} from "react";
import {
  getSupervisorEscalations,
} from "../../services/supervisorService";
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
    return (
      <p>
        Loading escalations...
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">
        No-Washer Escalations
      </h1>

      <p className="mt-2 text-slate-500">
        Bookings where automatic
        assignment could not find a
        suitable washer.
      </p>

      <div className="mt-8 space-y-4">
        {escalations.map((booking) => (
          <EscalationCard key={booking.id} booking={booking} />
        ))}

        {!escalations.length && (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
            No assignment escalations.
          </div>
        )}
      </div>
    </div>
  );
}