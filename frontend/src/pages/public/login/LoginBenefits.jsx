import { Link } from "react-router-dom";
import { Car, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Feature from "./Feature";

function LoginBenefits() {
  return (
    <aside className="login-benefits-panel hidden min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 p-7 text-white sm:p-9 lg:flex lg:flex-col xl:p-12">
        <Link to="/" className="flex w-fit items-center gap-3">
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

        <div className="login-benefits-content my-auto w-full max-w-xl py-8">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Sparkles size={16} />

            Professional doorstep car care
          </div>

          <h2 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            A cleaner car is only a few clicks away.
          </h2>

          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100 xl:text-lg xl:leading-8">
            Book trusted car-wash professionals, choose your
            preferred location and track your service from one
            simple platform.
          </p>

          <div className="mt-8 space-y-4">
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

        <p className="border-t border-white/15 pt-5 text-sm text-blue-100">
          © 2026 WashNow. All rights reserved.
        </p>
    </aside>
  );
}

export default LoginBenefits;
