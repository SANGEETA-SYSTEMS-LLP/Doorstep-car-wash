import { Clock3, MessageCircle, Phone, ShieldCheck, Star, UserRound } from "lucide-react";
import StatusItem from "./StatusItem";
import { statuses } from "./data";

function TrackingSidebar({ updateStatus, washer, navigate, distance, eta }) {
  return (
    <aside className="space-y-5">
            {/* WASHER CARD */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Washer
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserRound size={30} />
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold">
                    {washer?.name || "Assigned Washer"}
                  </h2>

                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Star
                      size={15}
                      className="fill-amber-400 text-amber-400"
                    />

                    <span className="font-semibold">
                      {washer?.rating || 0}
                    </span>

                    <span className="text-slate-400">
                      • {washer?.completedServices || 0} services
                    </span>
                  </div>
                </div>

                <div className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  VERIFIED
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700">
                  <Phone size={17} />
                  Call
                </button>

                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700">
                  <MessageCircle size={17} />
                  Message
                </button>
              </div>
            </div>

            {/* ETA */}

            <div className="rounded-3xl bg-blue-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <Clock3 size={22} />

                <p className="text-sm font-semibold text-blue-100">
                  Estimated arrival
                </p>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <p className="text-4xl font-bold">
                  {eta}
                </p>

                <p className="mb-1 text-blue-100">
                  minutes
                </p>
              </div>

              <p className="mt-3 text-sm text-blue-100">
                Your washer is {distance} km away.
              </p>

              <button
                onClick={() => {
                  updateStatus("washer_arrived");
                  navigate("/customer/washer-arrived");
                }}
                className="mt-5 w-full rounded-xl bg-white py-3 font-semibold text-blue-700"
              >
                Demo: Washer Arrived
              </button>
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
                        : status.description
                    }
                    completed={index < 2}
                    active={index === 2}
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
