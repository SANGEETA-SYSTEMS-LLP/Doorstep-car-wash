import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, Car, ChevronRight, Clock3, MapPin, Sparkles } from "lucide-react";
import QuickCard from "./QuickCard";
import CustomerHomeLocation from "./CustomerHomeLocation";

function CustomerHome() {
  return (
    <div>
      {/* HEADER */}

      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <p className="text-sm text-slate-500">
            Wednesday, 7 October
          </p>

          <h1 className="text-xl font-bold">
            Good morning, Gayatri 👋
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
            <Bell size={19} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            GP
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-8">
        {/* BOOKING HERO */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-8 text-white lg:p-10">
          <div className="relative z-10 max-w-xl">
            <div className="flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <Sparkles size={16} />
              Doorstep car care
            </div>

            <h2 className="mt-5 text-3xl font-bold lg:text-4xl">
              Your car deserves a fresh start.
            </h2>

            <p className="mt-4 max-w-lg leading-7 text-blue-100">
              Choose your location, select your vehicle and
              schedule a professional car wash in minutes.
            </p>

            <Link
              to="/customer/select-location"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-700"
            >
              Book a Wash
              <ArrowRight size={18} />
            </Link>
          </div>

          <Car className="absolute -bottom-10 right-8 hidden h-64 w-64 text-white/10 xl:block" />
        </section>

        {/* QUICK CARDS */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <QuickCard
            icon={<Car />}
            title="My Vehicles"
            value="2"
            text="Registered vehicles"
          />

          <QuickCard
            icon={<CalendarDays />}
            title="Bookings"
            value="08"
            text="Total bookings"
          />

          <QuickCard
            icon={<Clock3 />}
            title="Upcoming"
            value="01"
            text="Scheduled wash"
          />

          <QuickCard
            icon={<MapPin />}
            title="Saved Places"
            value="03"
            text="Saved addresses"
          />
        </section>

        {/* CURRENT BOOKING */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Upcoming booking
            </h2>

            <button className="text-sm font-semibold text-blue-600">
              View all
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Car />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold">
                      Premium Car Wash
                    </h3>

                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Scheduled
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Hyundai Creta • SUV
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      8 October
                    </span>

                    <span className="flex items-center gap-2">
                      <Clock3 size={16} />
                      10:30 AM
                    </span>
                  </div>
                </div>
              </div>

              <button className="flex items-center gap-2 font-semibold text-blue-600">
                View Details
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* LOCATION */}

        <CustomerHomeLocation />
      </div>
    </div>
  );
}

export default CustomerHome;
