import { Car, Trash2 } from "lucide-react";

function VehicleCard({ vehicle, onDelete, onBook }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Car />
          </div>
          <div>
            <h2 className="font-bold">{vehicle.brand} {vehicle.model}</h2>
            <p className="mt-1 text-sm text-slate-500">{vehicle.vehicle_number}</p>
            <p className="mt-1 text-xs text-slate-400">
              {vehicle.vehicle_type}{vehicle.colour && ` • ${vehicle.colour}`}
            </p>
          </div>
        </div>
        <button
          onClick={onDelete}
          aria-label={`Remove ${vehicle.brand} ${vehicle.model}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <button onClick={onBook} className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">
        Book Wash
      </button>
    </div>
  );
}

export default VehicleCard;
