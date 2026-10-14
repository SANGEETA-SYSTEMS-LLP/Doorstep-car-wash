import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Plus } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { deleteVehicle, getMyVehicles } from "../../../services/vehicleService";
import VehicleCard from "./VehicleCard";

function Vehicles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadVehicles = async () => {
      setVehicles([]);
      setError("");
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getMyVehicles(user.id);
        if (!cancelled) setVehicles(data);
      } catch (error) {
        console.error(error);
        if (!cancelled) setError("Unable to load vehicles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadVehicles();
    return () => { cancelled = true; };
  }, [user]);

  const handleDelete = async (vehicleId) => {
    const confirmed = window.confirm("Remove this vehicle?");
    if (!confirmed) return;
    try {
      setError("");
      await deleteVehicle(vehicleId, user.id);
      setVehicles((previous) =>
        previous.filter((vehicle) => vehicle.id !== vehicleId)
      );
    } catch (error) {
      console.error(error);
      setError("Unable to remove vehicle.");
    }
  };

  if (loading) {
    return (
      <div role="status" className="p-8">
        Loading vehicles...
      </div>
    );
  }

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

        {error && (
          <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && vehicles.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Car size={40} className="mx-auto text-slate-300" />

            <h2 className="mt-4 text-xl font-bold">
              No vehicles added
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add your first vehicle to start booking
              doorstep car washes.
            </p>

            <button
              onClick={() => navigate("/customer/vehicles/add")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              <Plus size={18} />
              Add Vehicle
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onDelete={() => handleDelete(vehicle.id)}
              onBook={() => navigate("/customer/select-location")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Vehicles;