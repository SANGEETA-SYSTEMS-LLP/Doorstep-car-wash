import { createContext, useCallback, useContext, useState } from "react";

const WasherContext = createContext(null);

const initialWasherState = {
  online: false,
  activeJob: null,
  jobStatus: "idle",
  beforePhotosAdded: false,
  completedTasks: [],
  serviceStarted: false,
  afterPhotosAdded: false,
  serviceCompleted: false,
  todayJobs: 4,
  todayEarnings: 1420,
};

export function WasherProvider({ children }) {
  // Job snapshots may include customer names, phone numbers, and addresses.
  // Keep them in memory only; the API is the source of truth after reload.
  const [washerState, setWasherState] = useState(() => {
    try {
      localStorage.removeItem("carWashWasherState");
      localStorage.removeItem("carWashWasherOnline");
    } catch { /* Storage may be unavailable; the in-memory state is still safe. */ }
    return initialWasherState;
  });

  const restoreJob = useCallback((job) => {
    const completed = ["service_completed", "completed"].includes(job.status);
    const serviceStarted = ["service_started", "service_completed", "completed"].includes(job.status);
    setWasherState(previous => ({
      ...(previous.activeJob?.databaseId === job.databaseId ? previous : initialWasherState),
      online: previous.online,
      activeJob: job,
      jobStatus: job.status,
      beforePhotosAdded: serviceStarted || completed,
      serviceStarted,
      afterPhotosAdded: completed,
      serviceCompleted: completed,
    }));
  }, []);

  const setOnline = (online) => {
    setWasherState((previous) => ({ ...previous, online }));
  };

  const acceptJob = (job) => {
    setWasherState((previous) => ({
      ...previous,
      activeJob: job,
      jobStatus: "accepted",
      beforePhotosAdded: false,
      completedTasks: [],
      serviceStarted: false,
      afterPhotosAdded: false,
      serviceCompleted: false,
    }));
  };

  const updateJobStatus = (jobStatus) => {
    setWasherState((previous) => ({ ...previous, jobStatus }));
  };

  const setCompletedTasks = (completedTasks) => {
    setWasherState((previous) => ({ ...previous, completedTasks }));
  };

  const markBeforePhotosAdded = () => {
    setWasherState((previous) => ({
      ...previous,
      beforePhotosAdded: true,
    }));
  };

  const startService = () => {
    setWasherState((previous) => ({
      ...previous,
      serviceStarted: true,
      jobStatus: "service_started",
    }));
  };

  const markAfterPhotosAdded = () => {
    setWasherState((previous) => ({
      ...previous,
      afterPhotosAdded: true,
    }));
  };

  const completeService = () => {
    setWasherState((previous) => {
      if (!previous.activeJob || previous.serviceCompleted) return previous;

      return {
        ...previous,
        serviceCompleted: true,
        jobStatus: "service_completed",
        todayJobs: previous.todayJobs + 1,
      };
    });
  };

  const closeActiveJob = () => {
    setWasherState((previous) => ({
      ...previous,
      activeJob: null,
      jobStatus: "idle",
      beforePhotosAdded: false,
      serviceStarted: false,
      completedTasks: [],
      afterPhotosAdded: false,
      serviceCompleted: false,
    }));
  };

  const rejectJob = () => {
    setWasherState((previous) => ({
      ...previous,
      jobStatus: "rejected",
    }));
  };

  return (
    <WasherContext.Provider
      value={{ restoreJob, washerState, setOnline, acceptJob, rejectJob, updateJobStatus, setCompletedTasks, startService, markBeforePhotosAdded, markAfterPhotosAdded, completeService, closeActiveJob }}
    >
      {children}
    </WasherContext.Provider>
  );
}

export function useWasher() {
  const context = useContext(WasherContext);
  if (!context) {
    throw new Error("useWasher must be used inside WasherProvider");
  }
  return context;
}

export default WasherContext;
