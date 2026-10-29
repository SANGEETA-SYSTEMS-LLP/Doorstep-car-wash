import { BadgeCheck, Star, UserRound } from "lucide-react";

function WasherProfileSummary() {
  return (
    <aside>
      <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-green-700">
          <UserRound size={50} />
        </div>
        <h2 className="mt-5 text-2xl font-bold">Rahul Kumar</h2>
        <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
          <BadgeCheck size={17} />
          <span className="text-sm font-semibold">Verified Partner</span>
        </div>
        <div className="mt-6 grid grid-cols-2 divide-x">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <p className="font-bold">4.8</p>
            </div>
            <p className="mt-1 text-xs text-slate-400">Rating</p>
          </div>
          <div>
            <p className="font-bold">326</p>
            <p className="mt-1 text-xs text-slate-400">Services</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default WasherProfileSummary;
