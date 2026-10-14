import { ArrowRight, Building2 } from "lucide-react";
import LocationMap from "./LocationMap";

function SelectLocationContent({ search, setSearch, selectedLocation, tower, setTower, flatNumber, setFlatNumber, landmark, setLandmark, handleContinue }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          <LocationMap search={search} setSearch={setSearch} />

          {/* LOCATION DETAILS */}

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Building2 />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-green-600">
                Society detected
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {selectedLocation.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedLocation.address}
              </p>

              <div className="mt-5 rounded-xl bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-700">
                  ✓ Service available in this area
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold">
                Complete address
              </h3>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tower / Block
                  </label>

                  <select
                    value={tower}
                    onChange={(e) => setTower(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-blue-500"
                  >
                    <option value="">Select Tower</option>
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Flat number
                  </label>

                  <input
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder="Example: 502"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Landmark
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Nearby landmark"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700"
            >
              Confirm Location
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
  );
}

export default SelectLocationContent;
