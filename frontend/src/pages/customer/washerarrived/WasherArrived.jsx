import { useNavigate } from "react-router-dom";
import {
  Car,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import { useBooking } from "../../../context/BookingContext";

function WasherArrived() {
  const { booking, updateStatus } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
              Booking {booking.bookingId || ""}
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Washer Arrived
            </h1>
          </div>

          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Arrived
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 lg:p-8">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-7 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white">
            <CheckCircle2 size={40} />
          </div>

          <h2 className="mt-5 text-3xl font-bold text-green-900">
            Your washer has arrived!
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-green-700">
            {washer?.name || "Assigned Washer"} has reached your service location. Please meet
            the washer and verify the service using your OTP.
          </p>
        </div>

        {/* WASHER */}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assigned Washer
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {washer?.name || "Assigned Washer"}
                </h2>

                <div className="mt-1 flex items-center gap-1 text-sm">
                  <Star
                    size={15}
                    className="fill-amber-400 text-amber-400"
                  />

                  <span className="font-semibold">
                    {washer?.rating || 0}
                  </span>

                  <span className="text-slate-400">
                    • {washer?.completedServices || 0} services
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-green-600">
                  ✓ Verified Professional
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200">
                <Phone size={18} />
              </button>

              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200">
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* SERVICE */}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Car />
            </div>

            <p className="mt-4 text-xs font-bold uppercase text-slate-400">
              Vehicle
            </p>

            <h3 className="mt-2 font-bold">
              {booking.vehicle?.name || "Vehicle"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {booking.vehicle
                ? `${booking.vehicle.type} • ${booking.vehicle.colour} • ${booking.vehicle.number}`
                : ""}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin />
            </div>

            <p className="mt-4 text-xs font-bold uppercase text-slate-400">
              Location
            </p>

            <h3 className="mt-2 font-bold">
              {booking.location?.name || "Service Location"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {booking.address?.tower || ""}
              {booking.address?.flatNumber &&
                ` • Flat ${booking.address.flatNumber}`}
            </p>
          </div>
        </div>

        {/* OTP */}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Service Verification
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Give this OTP only after confirming that the
                assigned washer has reached your location.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-950 p-6 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Service OTP
            </p>

            <p className="mt-3 text-4xl font-bold tracking-[0.4em]">
              4826
            </p>
          </div>

          <button
            onClick={() => {
              updateStatus("otp_verified");
              navigate("/customer/service-progress");
            }}
            className="mt-6 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700"
          >
            OTP Verified — Continue
          </button>
        </div>
      </main>
    </div>
  );
}

export default WasherArrived;