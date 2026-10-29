import { UserRound } from "lucide-react";

function WasherMarker({ className, label }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-md">
          <UserRound size={19} />
        </div>

        <div className="absolute left-1/2 top-12 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-bold shadow">
          {label}
        </div>
      </div>
    </div>
  );
}

export default WasherMarker;
