import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../../services/supabase";

import {
  getSupervisorJobs,
} from "../../services/supervisorService";
import SupervisorJobCard from "./SupervisorJobCard";

export default function SupervisorJobs() {
  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadJobs = async () => {
      try {
        const data = await getSupervisorJobs();
        if (active) {
          setJobs(data.jobs || []);
          setError("");
        }
      } catch (error) {
        if (active) setError(error.message || "Unable to load active jobs.");
      } finally {
        if (active) setLoading(false);
      }
    };

    const channel = supabase
      .channel("supervisor-active-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        loadJobs,
      )
      .subscribe((status) => {
        if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
          setError("Live job updates are unavailable. Refresh the page to check for changes.");
        }
      });

    loadJobs();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <p>
        Loading active jobs...
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900">
        Active Jobs
      </h1>

      <p className="mt-2 text-slate-500">
        Monitor all currently active
        car wash services.
      </p>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {jobs.map((job) => <SupervisorJobCard key={job.id} job={job} />)}

        {!jobs.length && (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
            No active jobs.
          </div>
        )}
      </div>
    </div>
  );
}