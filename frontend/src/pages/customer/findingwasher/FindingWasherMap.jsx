import ServiceMap from "../../../components/map/ServiceMap";
import { useBooking } from "../../../context/BookingContext";
export default function FindingWasherMap({ washerFound }) {
  const { booking } = useBooking();
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
    <div className="p-5"><h2 className="font-bold">{washerFound ? "Washer assigned" : "Finding a washer"}</h2><p className="mt-1 text-sm text-slate-500">Your selected service location</p></div>
    <ServiceMap location={booking.location} className="h-[500px]" />
  </section>;
}
