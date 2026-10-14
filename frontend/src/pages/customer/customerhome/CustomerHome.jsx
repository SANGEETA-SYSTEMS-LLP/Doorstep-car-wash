import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Car, Clock3, MapPin, Sparkles } from "lucide-react";
import QuickCard from "./QuickCard";
import CustomerHomeLocation from "./CustomerHomeLocation";
import CustomerHomeHeader from "./CustomerHomeHeader";
import UpcomingBooking from "./UpcomingBooking";

function CustomerHome() {
  return (
    <div>
      {/* HEADER */}

      <CustomerHomeHeader />

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

        <UpcomingBooking />

        {/* LOCATION */}

        <CustomerHomeLocation />
      </div>
    </div>
  );
}

export default CustomerHome;
