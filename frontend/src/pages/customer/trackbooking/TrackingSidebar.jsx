import { Clock3, ShieldCheck } from "lucide-react";
import StatusItem from "./StatusItem";
import { statuses } from "./data";
import TrackingWasherCard from "./TrackingWasherCard";

function TrackingSidebar({ currentStatus, washer, distance, eta }) {
  const currentStep = {
    pending: 0,
    confirmed: 0,
    finding_washer: 0,
    washer_assigned: 1,
    washer_on_the_way: 2,
    washer_arrived: 3,
    otp_verified: 4,
    service_started: 4,
    service_completed: 5,
    completed: 5,
  }[currentStatus] ?? 0;

  return (
    <aside className="space-y-5">
            {/* WASHER CARD */}

            <TrackingWasherCard washer={washer} />

            {/* ETA */}

            <div className="rounded-3xl bg-blue-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <Clock3 size={22} />

                <p className="text-sm font-semibold text-blue-100">
                  Estimated arrival
                </p>
              </div>

              {currentStatus === "washer_on_the_way" ? (
                <>
                  <div className="mt-4 flex items-end gap-2">
                    <p className="text-4xl font-bold">{eta}</p>
                    <p className="mb-1 text-blue-100">minutes</p>
                  </div>
                  <p className="mt-3 text-sm text-blue-100">
                    Your washer is {distance} km away.
                  </p>
                </>
              ) : (
                <p className="mt-4 text-xl font-bold">
                  {currentStatus === "service_completed"
                    ? "Awaiting validation"
                    : currentStatus === "completed"
                      ? "Completed"
                      : "In Progress"}
                </p>
              )}
            </div>

            {/* TIMELINE */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">
                Booking Status
              </h2>

              <div className="mt-6">
                {statuses.map((status, index) => (
                  <StatusItem
                    key={status.title}
                    title={status.title}
                    description={
                      status.title === "Washer assigned"
                        ? `${washer?.name || "Assigned Washer"} accepted your booking.`
                        : status.title === "Service completed"
                          ? currentStatus === "completed"
                            ? "Your service has been validated."
                            : "Service photos are submitted and awaiting validation."
                        : status.description
                    }
                    completed={index < currentStep || (index === currentStep && currentStatus === "completed")}
                    active={index === currentStep && currentStatus !== "completed"}
                    last={index === statuses.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl bg-green-50 p-5">
              <ShieldCheck
                size={21}
                className="shrink-0 text-green-600"
              />

              <div>
                <p className="text-sm font-bold text-green-800">
                  Safe & verified
                </p>

                <p className="mt-1 text-xs leading-5 text-green-700">
                  Your assigned washer has completed the
                  verification process.
                </p>
              </div>
            </div>
          </aside>
  );
}

export default TrackingSidebar;
