import { Navigation } from "lucide-react";

function WasherFound({ onTrack }) {
  return (
    <div>
      <h2 className="text-xl font-bold">Washer Assigned</h2>
      <p className="mt-2 text-sm text-slate-500">
        A washer has accepted your booking.
      </p>
      <button
        onClick={onTrack}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white"
      >
        <Navigation size={18} />
        Track Washer
      </button>
    </div>
  );
}

export default WasherFound;
