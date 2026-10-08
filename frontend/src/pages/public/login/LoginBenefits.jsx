import { Link } from "react-router-dom";
import { Car, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Feature from "./Feature";

function LoginBenefits() {
  return (
    <div className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-12 text-white lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Car size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold">WashNow</h1>
            <p className="text-xs text-blue-100">
              Doorstep Car Care
            </p>
          </div>
        </Link>

        <div className="my-auto max-w-xl">
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Sparkles size={16} />

            Professional doorstep car care
          </div>

          <h2 className="text-5xl font-bold leading-tight">
            A cleaner car is only a few clicks away.
          </h2>

          <p className="mt-6 text-lg leading-8 text-blue-100">
            Book trusted car-wash professionals, choose your
            preferred location and track your service from one
            simple platform.
          </p>

          <div className="mt-10 space-y-5">
            <Feature
              icon={<MapPin size={20} />}
              title="Location based service"
              text="Book a wash directly at your home, office or society."
            />

            <Feature
              icon={<ShieldCheck size={20} />}
              title="Verified professionals"
              text="Get your vehicle serviced by trusted washers."
            />

            <Feature
              icon={<Car size={20} />}
              title="Live service tracking"
              text="Follow your booking from assignment to completion."
            />
          </div>
        </div>

        <p className="text-sm text-blue-100">
          © 2026 WashNow. All rights reserved.
        </p>
      </div>
  );
}

export default LoginBenefits;
