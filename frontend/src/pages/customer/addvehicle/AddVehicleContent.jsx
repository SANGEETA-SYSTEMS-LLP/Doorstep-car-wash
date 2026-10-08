import { ArrowLeft, Car, CheckCircle2, Palette, Save } from "lucide-react";
import Input from "./Input";

function AddVehicleContent({ navigate, saved, form, handleChange, handleSubmit }) {
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
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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

          {saved && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-green-50 p-4 text-green-700">
              <CheckCircle2 size={20} />
              Vehicle added successfully.
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <Input
              label="Vehicle Registration Number"
              name="vehicleNumber"
              value={form.vehicleNumber}
              onChange={handleChange}
              placeholder="OD 02 AB 1234"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Vehicle Type
              </label>

              <select
                required
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-blue-500"
              >
                <option value="">Select vehicle type</option>
                <option value="hatchback">Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Hyundai"
              />

              <Input
                label="Model"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="Creta"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Vehicle Colour
              </label>

              <div className="relative">
                <Palette
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  required
                  name="colour"
                  value={form.colour}
                  onChange={handleChange}
                  placeholder="White"
                  className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 rounded-xl border border-slate-300 py-3.5 font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white"
              >
                <Save size={18} />
                Save Vehicle
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddVehicleContent;
