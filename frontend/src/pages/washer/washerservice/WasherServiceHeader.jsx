import { ArrowLeft, Car, Clock3, Sparkles } from "lucide-react";
import Summary from "./Summary";
import StageBadge from "./StageBadge";

function WasherServiceHeader({ jobId, stage, activeJob, onBack }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">{jobId}</p>
              <h1 className="font-bold">Service Job</h1>
            </div>
          </div>
          <StageBadge stage={stage} />
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary icon={<Car />} label="Vehicle" value={activeJob.vehicle?.name || "Vehicle"} />
        <Summary icon={<Sparkles />} label="Service" value={activeJob.service || "Car Wash"} />
        <Summary icon={<Clock3 />} label="Duration" value="60 Minutes" />
      </div>
    </>
  );
}

export default WasherServiceHeader;
