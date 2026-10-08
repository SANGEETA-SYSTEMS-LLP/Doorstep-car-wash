import { ArrowRight, Building2, LocateFixed, MapPin, Search } from "lucide-react";

function SelectLocationContent({ search, setSearch, selectedLocation, tower, setTower, flatNumber, setFlatNumber, landmark, setLandmark, handleContinue }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          {/* MAP */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {/* SEARCH */}

            <div className="border-b border-slate-200 p-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search apartment, society, area..."
                    className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                  <LocateFixed size={18} />
                  <span className="hidden sm:inline">
                    Current Location
                  </span>
                </button>
              </div>
            </div>

            {/* MOCK MAP */}

            <div className="relative h-[560px] overflow-hidden bg-slate-100">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] bg-[size:50px_50px]" />

              {/* Roads */}

              <div className="absolute left-[10%] top-[35%] h-6 w-[85%] rotate-6 bg-white shadow-sm" />

              <div className="absolute left-[40%] top-[-10%] h-[120%] w-7 -rotate-12 bg-white shadow-sm" />

              <div className="absolute left-[5%] top-[70%] h-5 w-[90%] -rotate-3 bg-white shadow-sm" />

              {/* Buildings */}

              <div className="absolute left-[12%] top-[15%] h-20 w-24 rounded-xl bg-slate-200" />

              <div className="absolute right-[15%] top-[20%] h-24 w-32 rounded-xl bg-slate-200" />

              <div className="absolute bottom-[12%] left-[18%] h-24 w-32 rounded-xl bg-slate-200" />

              <div className="absolute bottom-[18%] right-[15%] h-20 w-24 rounded-xl bg-slate-200" />

              {/* Pin */}

              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-8 ring-blue-600/15">
                  <MapPin size={30} />
                </div>
              </div>

              <div className="absolute bottom-5 left-5 rounded-xl bg-white px-4 py-3 text-sm shadow-lg">
                <p className="font-semibold">
                  Drag the map
                </p>

                <p className="text-slate-500">
                  Move the pin to your exact location.
                </p>
              </div>
            </div>
          </div>

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
