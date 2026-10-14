import { Car } from "lucide-react";

function NoActiveService({ onDashboard }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <Car size={40} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-xl font-bold">No Active Service</h2>
        <p className="mt-2 text-sm text-slate-500">There is currently no accepted customer booking.</p>
        <button onClick={onDashboard} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default NoActiveService;
