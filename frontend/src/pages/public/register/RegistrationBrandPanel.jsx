import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import Process from "./Process";

function RegistrationBrandPanel() {
  return (
    <div className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-12 text-white lg:flex lg:flex-col">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Car /></div>
        <div>
          <p className="text-xl font-bold">WashNow</p>
          <p className="text-xs text-blue-200">Doorstep Car Care</p>
        </div>
      </Link>
      <div className="my-auto">
        <p className="font-semibold text-blue-300">GET STARTED</p>
        <h1 className="mt-4 max-w-lg text-5xl font-bold leading-tight">
          Professional car care at your doorstep.
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
          Create your account, add your vehicle and book your first doorstep wash in minutes.
        </p>
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-blue-200">BOOKING PROCESS</p>
          <div className="mt-5 space-y-5">
            <Process number="01" text="Choose your location" />
            <Process number="02" text="Add your vehicle" />
            <Process number="03" text="Select a wash package" />
            <Process number="04" text="Choose date and time" />
            <Process number="05" text="Track your washer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationBrandPanel;
