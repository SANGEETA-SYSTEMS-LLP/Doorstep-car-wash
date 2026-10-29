import { ArrowLeft, ArrowRight, Car, Check, Plus } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";

function SelectVehicleContent({ navigate, selected, setSelected, vehicles, loading, error, onRetry, handleContinue }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={2} />

      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <button
          onClick={() =>
            navigate("/customer/select-location")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7">
          <p className="font-semibold text-green-600">
            SELECT VEHICLE
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Which vehicle needs a wash?
          </h1>

          <p className="mt-2 text-slate-500">
            Package pricing will depend on your vehicle type.
          </p>
        </div>

        {loading && (
          <p role="status" className="mt-8 text-slate-500">Loading vehicles...</p>
        )}
        {error && (
          <div role="alert" className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={onRetry} className="rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold text-red-700 hover:bg-red-100">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && vehicles.length === 0 && (
          <p className="mt-8 text-slate-500">No vehicles added. Add a vehicle to continue.</p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {vehicles.map((vehicle) => {
            const active = selected === vehicle.id;

            return (
              <button
                key={vehicle.id}
                onClick={() => setSelected(vehicle.id)}
                className={`relative rounded-2xl border-2 bg-white p-6 text-left transition ${
                  active
                    ? "border-green-600 shadow-md shadow-green-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {active && (
                  <div className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                    <Check size={16} />
                  </div>
                )}

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-green-50 text-green-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Car size={28} />
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  {vehicle.brand}{" "}{vehicle.model}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {vehicle.vehicle_number}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {vehicle.vehicle_type}
                  {vehicle.seating_capacity ? ` · ${vehicle.seating_capacity} seats` : ""}
                  {vehicle.colour && ` • ${vehicle.colour}`}
                </p>
              </button>
            );
          })}

          <button
            onClick={() => navigate("/customer/vehicles/add")}
            className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-slate-500 transition hover:border-green-400 hover:text-green-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Plus />
            </div>

            <p className="mt-4 font-bold">
              Add another vehicle
            </p>

            <p className="mt-1 text-sm">
              Register a new vehicle
            </p>
          </button>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            disabled={loading || Boolean(error) || !vehicles.some((vehicle) => vehicle.id === selected)}
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-7 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}

export default SelectVehicleContent;
