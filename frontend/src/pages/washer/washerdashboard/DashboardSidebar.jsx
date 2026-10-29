import { Navigation } from "lucide-react";
import Schedule from "./Schedule";

function DashboardSidebar({ online }) {
  return (
    <aside className="space-y-5">
            {/* AVAILABILITY */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">
                Availability
              </h2>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold">
                    Current Status
                  </p>

                  <p
                    className={`mt-1 text-sm ${
                      online
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  >
                    {online
                      ? "Ready for bookings"
                      : "Not receiving jobs"}
                  </p>
                </div>

                <div
                  className={`h-3 w-3 rounded-full ${
                    online
                      ? "animate-pulse bg-green-500"
                      : "bg-slate-300"
                  }`}
                />
              </div>
            </div>

            {/* TODAY */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">
                Today's Schedule
              </h2>

              <div className="mt-5 space-y-4">
                <Schedule
                  time="08:00 AM"
                  service="Basic Wash"
                  status="Completed"
                />

                <Schedule
                  time="09:30 AM"
                  service="Premium Wash"
                  status="Completed"
                />

                <Schedule
                  time="10:30 AM"
                  service="Premium Wash"
                  status="Current"
                />

                <Schedule
                  time="02:00 PM"
                  service="Complete Detailing"
                  status="Upcoming"
                />
              </div>
            </div>

            {/* LOCATION */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Navigation
                  size={19}
                  className="text-green-600"
                />

                <h2 className="font-bold">
                  Service Area
                </h2>
              </div>

              <p className="mt-4 text-sm font-semibold">
                Madhapur Zone
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Service radius: 5 km
              </p>
            </div>
          </aside>
  );
}

export default DashboardSidebar;
