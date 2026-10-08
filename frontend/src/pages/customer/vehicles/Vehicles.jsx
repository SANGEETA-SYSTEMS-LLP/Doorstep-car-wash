import { useNavigate } from "react-router-dom";
import {
  Car,
  MoreVertical,
  Plus,
} from "lucide-react";

const vehicles = [
  {
    id: 1,
    name: "Hyundai Creta",
    number: "OD 02 AB 1234",
    type: "SUV",
    colour: "White",
  },
  {
    id: 2,
    name: "Maruti Suzuki Swift",
    number: "OD 05 CD 5678",
    type: "Hatchback",
    colour: "Blue",
  },
];

function Vehicles() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-blue-600">
              GARAGE
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              My Vehicles
            </h1>

            <p className="mt-2 text-slate-500">
              Manage vehicles used for your car-wash bookings.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/customer/vehicles/add")
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Car size={27} />
                </div>

                <button className="text-slate-400">
                  <MoreVertical />
                </button>
              </div>

              <h2 className="mt-5 text-xl font-bold">
                {vehicle.name}
              </h2>

              <p className="mt-1 font-medium text-slate-500">
                {vehicle.number}
              </p>

              <div className="mt-5 flex gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold">
                  {vehicle.type}
                </span>

                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold">
                  {vehicle.colour}
                </span>
              </div>

              <button
                onClick={() =>
                  navigate("/customer/select-location")
                }
                className="mt-6 w-full rounded-xl border border-blue-200 py-3 font-semibold text-blue-600"
              >
                Book Wash
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Vehicles;