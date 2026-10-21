import AddressActions from "./AddressActions";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Car, Plus } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { getSavedAddresses } from "../../../services/locations/locationService";
import { getMyVehicles } from "../../../services/customer/vehicleService";

export default function SavedCustomerDetails() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [errors, setErrors] = useState({});
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setAddresses(null); setVehicles(null); setErrors({});
    if (user?.id) {
      getSavedAddresses(user.id).then(data => { if (active) setAddresses(data); }).catch(error => { if (active) setErrors(previous => ({...previous, addresses: "Unable to load saved addresses: " + error.message})); });
      getMyVehicles(user.id).then(data => { if (active) setVehicles(data); }).catch(error => { if (active) setErrors(previous => ({...previous, vehicles: "Unable to load vehicles: " + error.message})); });
    }
    return () => { active = false; };
  }, [user?.id, version]);
  useEffect(() => {
    const refresh = () => setVersion(value => value + 1);
    window.addEventListener("customer-address-saved", refresh);
    return () => window.removeEventListener("customer-address-saved", refresh);
  }, []);
  return <div className="mt-8 grid min-w-0 items-start gap-6 xl:grid-cols-2">
    <section id="saved-addresses" className="min-w-0 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><MapPin size={22} className="text-blue-700"/>Saved addresses</h2><Link to="/customer/select-location" className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Plus size={16}/>Add address</Link></div>
      <p className="mt-2 text-sm text-slate-500">Your saved service locations.</p>
      {errors.addresses ? <Error message={errors.addresses} retry={() => setVersion(value => value + 1)}/> : addresses === null ? <p role="status" className="mt-5 text-sm text-slate-500">Loading addresses…</p> : !addresses.length ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No address saved yet. Add your location using the profile completion form or choose Add address.</p> : <div className="mt-5 space-y-3">{addresses.map(address => <article key={address.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5"><h3 className="font-semibold text-slate-900">{address.label || "Service address"}</h3><p className="mt-2 break-words text-sm leading-6 text-slate-600">{address.address_line}</p><p className="text-sm leading-6 text-slate-600">{[address.city,address.state,address.postal_code].filter(Boolean).join(", ")}</p>{(address.tower || address.flat_number) && <p className="mt-2 text-sm text-slate-600">{[address.tower && "Tower: " + address.tower,address.flat_number && "Flat / house: " + address.flat_number].filter(Boolean).join(" · ")}</p>}{address.landmark && <p className="mt-1 text-sm text-slate-500">Landmark: {address.landmark}</p>}<AddressActions address={address} userId={user?.id}/></article>)}</div>}
    </section>
    <section className="min-w-0 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><Car size={22} className="text-blue-700"/>My vehicles</h2><Link to="/customer/vehicles/add" className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Plus size={16}/>Add vehicle</Link></div>
      <p className="mt-2 text-sm text-slate-500">Vehicle details used for your wash bookings.</p>
      {errors.vehicles ? <Error message={errors.vehicles} retry={() => setVersion(value => value + 1)}/> : vehicles === null ? <p role="status" className="mt-5 text-sm text-slate-500">Loading vehicles…</p> : !vehicles.length ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No vehicles added yet. Add your first vehicle to get started.</p> : <div className="mt-5 space-y-3">{vehicles.map(vehicle => <article key={vehicle.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold text-slate-900">{[vehicle.brand,vehicle.model].filter(Boolean).join(" ") || "Vehicle"}</h3>{vehicle.is_default && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Default</span>}{vehicle.is_active === false && <span className="text-xs text-slate-500">Inactive</span>}</div><p className="mt-2 font-semibold tracking-wide text-slate-700">{vehicle.vehicle_number}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Type</dt><dd className="mt-1 capitalize text-slate-800">{vehicle.vehicle_type || "Not provided"}</dd></div><div><dt className="text-slate-500">Colour</dt><dd className="mt-1 text-slate-800">{vehicle.colour || "Not provided"}</dd></div></dl></article>)}</div>}
      <Link to="/customer/vehicles" className="mt-5 inline-block py-2 text-sm font-semibold text-blue-700 underline">Manage vehicles</Link>
    </section>
  </div>;
}
function Error({message,retry}) { return <p role="alert" className="mt-5 text-sm text-red-700">{message} <button type="button" onClick={retry} className="underline">Try again</button></p>; }
