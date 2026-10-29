import { ArrowLeft, Car } from "lucide-react";
import VehicleForm from "./VehicleForm";

function AddVehicleContent({ navigate, loading, error, form, handleChange, handleSubmit }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center px-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
              My Vehicles
            </p>

            <h1 className="text-xl font-bold">
              Add Vehicle
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-6 lg:p-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 lg:p-9">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <Car size={27} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Vehicle Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add the vehicle you want to use for bookings.
              </p>
            </div>
          </div>

          <VehicleForm
            navigate={navigate}
            loading={loading}
            error={error}
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}

export default AddVehicleContent;
