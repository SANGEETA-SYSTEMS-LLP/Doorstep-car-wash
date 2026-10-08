import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <Sparkles size={16} />
                Professional car care at your doorstep
              </div>

              <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                Your car wash,
                <span className="text-blue-600"> wherever you are.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Choose your location, vehicle and preferred wash package.
                A verified professional comes directly to you.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/customer/select-location"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Book a Car Wash

                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#how-it-works"
                  className="rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  How it works
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Verified washers
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Doorstep service
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  Live tracking
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Your location
                    </p>

                    <h3 className="font-semibold text-slate-900">
                      Find car wash services nearby
                    </h3>
                  </div>

                  <MapPin className="text-blue-600" />
                </div>

                <div className="relative h-80 overflow-hidden rounded-2xl bg-slate-100">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]" />

                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                      <MapPin size={26} />
                    </div>

                    <div className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow">
                      Your location
                    </div>
                  </div>
                </div>

                <Link
                  to="/customer/select-location"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white"
                >
                  Select Your Location

                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="text-center">
              <p className="font-semibold text-blue-600">
                SIMPLE BOOKING
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Get your car cleaned in four steps
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Step
                icon={<MapPin />}
                number="01"
                title="Choose Location"
                description="Set your home, office or society location."
              />

              <Step
                icon={<Car />}
                number="02"
                title="Select Vehicle"
                description="Choose the vehicle that needs cleaning."
              />

              <Step
                icon={<ShieldCheck />}
                number="03"
                title="Choose Package"
                description="Pick the wash package that suits you."
              />

              <Step
                icon={<CalendarDays />}
                number="04"
                title="Schedule Wash"
                description="Choose a convenient date and time."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Step({ icon, number, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <span className="text-sm font-bold text-slate-300">
          {number}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default Home;