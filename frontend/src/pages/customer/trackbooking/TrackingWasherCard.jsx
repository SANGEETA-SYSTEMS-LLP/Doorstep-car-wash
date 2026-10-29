import { MessageCircle, Phone, Star, UserRound } from "lucide-react";

function TrackingWasherCard({ washer }) {
  const phone = String(washer?.phone || "").replace(/[^+0-9]/g, "");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        Your Washer
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <UserRound size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{washer?.name || "Assigned Washer"}</h2>
          {phone && <a href={`tel:${phone}`} className="mt-1 block break-all text-sm font-semibold text-green-700">{washer.phone}</a>}
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold">{washer?.rating || 0}</span>
            <span className="text-slate-400">• {washer?.totalJobs ?? washer?.completedServices ?? 0} services</span>
          </div>
        </div>

      </div>
      {phone ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Phone size={17} />
            Call
          </a>
          <a
            href={`sms:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <MessageCircle size={17} />
            Message
          </a>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          Washer contact number is not available.
        </p>
      )}
    </div>
  );
}

export default TrackingWasherCard;
