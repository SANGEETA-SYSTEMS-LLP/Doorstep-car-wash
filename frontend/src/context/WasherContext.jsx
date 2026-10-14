import { createContext, useCallback, useContext, useEffect, useState } from "react";

const WasherContext = createContext(null);

const initialWasherState = {
  online: false,
  activeJob: null,
  jobStatus: "idle",
  otpVerified: false,
  beforePhotosAdded: false,
  completedTasks: [],
  serviceStarted: false,
  afterPhotosAdded: false,
  serviceCompleted: false,
  todayJobs: 4,
  todayEarnings: 1420,
};

export function WasherProvider({ children }) {
  const [washerState, setWasherState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("carWashWasherState") || "null");
      return {
        ...initialWasherState,
        ...(saved && typeof saved === "object" ? saved : {}),
        activeJob:
          saved?.activeJob &&
          typeof saved.activeJob === "object"
          ? { ...saved.activeJob, earning: null }
          : null,
        completedTasks: Array.isArray(saved?.completedTasks)
          ? saved.completedTasks.filter((task) => typeof task === "string")
          : [],
        online: localStorage.getItem("carWashWasherOnline") === "true",
      };
    } catch (error) {
      console.error("Unable to load washer availability:", error);
      return initialWasherState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("carWashWasherOnline", String(washerState.online));
      localStorage.setItem("carWashWasherState", JSON.stringify(washerState));
    } catch (error) {
      console.error("Unable to save washer availability:", error);
    }
  }, [washerState]);

  const restoreJob = useCallback((job) => {
    const completed = ["service_completed", "completed"].includes(job.status);
    const serviceStarted = ["service_started", "service_completed", "completed"].includes(job.status);
    const otpVerified = ["otp_verified", "service_started", "service_completed", "completed"].includes(job.status);
    setWasherState(previous => ({
      ...(previous.activeJob?.databaseId === job.databaseId ? previous : initialWasherState),
      online: previous.online,
      activeJob: job,
      jobStatus: job.status,
      otpVerified,
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
      otpVerified: false,
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

  const verifyOtp = () => {
    setWasherState((previous) => ({
      ...previous,
      otpVerified: true,
      jobStatus: "otp_verified",
    }));
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
      otpVerified: false,
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
      value={{ restoreJob, washerState, setOnline, acceptJob, rejectJob, updateJobStatus, setCompletedTasks, startService, verifyOtp, markBeforePhotosAdded, markAfterPhotosAdded, completeService, closeActiveJob }}
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
