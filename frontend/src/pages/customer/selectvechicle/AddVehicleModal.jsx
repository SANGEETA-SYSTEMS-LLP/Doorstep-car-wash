import Input from "./Input";

function AddVehicleModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
      <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Add Vehicle
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your vehicle information.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Input label="Vehicle Number" placeholder="OD 02 AB 1234" />

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Vehicle Type
            </label>

            <select className="w-full rounded-xl border border-slate-300 px-4 py-3.5">
              <option>Select type</option>
              <option>Hatchback</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Luxury</option>
            </select>
          </div>

          <Input label="Brand" placeholder="Hyundai" />

          <Input label="Model" placeholder="Creta" />

          <Input label="Colour" placeholder="White" />
        </div>

        <div className="mt-7 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white"
          >
            Add Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddVehicleModal;
