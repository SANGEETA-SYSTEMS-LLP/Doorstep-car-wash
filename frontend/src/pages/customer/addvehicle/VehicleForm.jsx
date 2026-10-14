import { Palette, Save } from "lucide-react";
import Input from "./Input";

function VehicleForm({ navigate, loading, error, form, handleChange, handleSubmit }) {
  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <Input
        label="Vehicle Registration Number"
        name="vehicleNumber"
        value={form.vehicleNumber}
        onChange={handleChange}
        placeholder="OD 02 AB 1234"
      />
      <div>
        <label className="mb-2 block text-sm font-semibold">Vehicle Type</label>
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
        <Input label="Brand" name="brand" value={form.brand} onChange={handleChange} placeholder="Hyundai" />
        <Input label="Model" name="model" value={form.model} onChange={handleChange} placeholder="Creta" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">Vehicle Colour</label>
        <div className="relative">
          <Palette size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="colour"
            value={form.colour}
            onChange={handleChange}
            placeholder="White"
            className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500"
          />
        </div>
      </div>
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
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
          disabled={loading}
          className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? "Saving Vehicle..." : "Save Vehicle"}
        </button>
      </div>
    </form>
  );
}

export default VehicleForm;
