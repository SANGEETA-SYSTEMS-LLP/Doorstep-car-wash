import { MessageCircle, Phone, Star, UserRound } from "lucide-react";

function WasherArrivalProfile({ washer }) {
  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Washer</p>
      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <UserRound size={30} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{washer?.name || "Assigned Washer"}</h2>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-semibold">{washer?.rating || 0}</span>
              <span className="text-slate-400">• {washer?.completedServices || 0} services</span>
            </div>
            <p className="mt-2 text-sm font-medium text-green-600">Verified professional</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"><Phone size={18} /></button>
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"><MessageCircle size={18} /></button>
        </div>
      </div>
    </div>
  );
}

export default WasherArrivalProfile;
