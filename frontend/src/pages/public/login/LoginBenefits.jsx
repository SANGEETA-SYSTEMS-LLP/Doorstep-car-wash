import { Car, MapPin, ShieldCheck } from "lucide-react";
import { WashNowBrand } from "../../../components/layout/WashNowBrand";
import Feature from "./Feature";

function LoginBenefits() {
  return (
    <aside className="login-benefits-panel hidden min-h-screen bg-green-900 p-7 text-white sm:p-9 lg:flex lg:flex-col xl:p-12">
        <WashNowBrand light />

        <div className="login-benefits-content my-auto w-full max-w-xl py-8">
          <p className="mb-5 w-fit border-y border-white/25 py-2 text-sm font-semibold">Professional doorstep car care</p>

          <h2 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            A cleaner car is only a few clicks away.
          </h2>

          <p className="mt-5 max-w-lg text-base leading-7 text-green-100 xl:text-lg xl:leading-8">
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

        <p className="border-t border-white/15 pt-5 text-sm text-green-100">
          © 2026 WashNow. All rights reserved.
        </p>
    </aside>
  );
}

export default LoginBenefits;
