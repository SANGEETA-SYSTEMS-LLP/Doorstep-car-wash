import { MessageCircle, Phone, Star, UserRound } from "lucide-react";

function TrackingWasherCard({ washer }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Your Washer
      </p>
      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <UserRound size={30} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{washer?.name || "Assigned Washer"}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold">{washer?.rating || 0}</span>
            <span className="text-slate-400">• {washer?.completedServices || 0} services</span>
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
  );
}

export default TrackingWasherCard;
