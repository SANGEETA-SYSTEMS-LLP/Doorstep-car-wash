import { Navigation, UserRound } from "lucide-react";

function WasherFound({ onTrack }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <UserRound size={30} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-600">
            Washer Assigned
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Rahul Kumar
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            ⭐ 4.8 • 326 services
          </p>
        </div>
      </div>

      <div className="my-6 border-t border-slate-100" />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-400">
            Distance
          </p>

          <p className="mt-1 font-bold">
            1.8 km
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-400">
            ETA
          </p>

          <p className="mt-1 font-bold">
            12 mins
          </p>
        </div>
      </div>

      <button
        onClick={onTrack}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white"
      >
        <Navigation size={18} />
        Track Washer
      </button>
    </div>
  );
}

export default WasherFound;
