import { Car, Clock3, Droplets, Image, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import PhotoPlaceholder from "./PhotoPlaceholder";


function ServiceProgressContent({ booking, washer }) {
  return (
    <main className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* PROGRESS HERO */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-500 p-7 text-white lg:p-9">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Droplets />
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                Your car is getting cleaned
              </h2>

              <p className="mt-3 max-w-xl text-blue-100">
                {washer?.name || "Your washer"} is currently working on your{" "}
                {booking.package?.name || "car wash"}.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <Clock3 />

                <div>
                  <p className="text-xs text-blue-100">
                    Booking status
                  </p>

                  <p className="text-2xl font-bold">
                    {(booking.status || "service_started").replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* SERVICE STEPS */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Service Progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Follow the cleaning process.
                </p>
              </div>

              <Sparkles className="text-blue-600" />
            </div>

            <p className="mt-8 text-slate-500">Your washer is completing the service checklist and uploading photos. This page will update when the service is completed.</p>
          </section>

          <aside className="space-y-5">
            {/* WASHER */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Service Professional
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserRound size={26} />
                </div>

                <div>
                  <h3 className="font-bold">
                    {washer?.name || "Assigned Washer"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {booking.package?.name
                      ? `${booking.package.name} Professional`
                      : "Car Wash Professional"}
                  </p>
                </div>
              </div>
            </div>

            {/* VEHICLE */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <Car className="text-blue-600" />

                <div>
                  <p className="font-bold">
                    {booking.vehicle?.name || "Vehicle"}
                  </p>

                  <p className="text-sm text-slate-500">
                    {booking.vehicle?.number || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* BEFORE PHOTOS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Image size={19} className="text-blue-600" />

                <h3 className="font-bold">
                  Before Service Photos
                </h3>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <PhotoPlaceholder text="Front View" />
                <PhotoPlaceholder text="Rear View" />
                <PhotoPlaceholder text="Interior" />
                <PhotoPlaceholder text="Side View" />
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl bg-green-50 p-5">
              <ShieldCheck className="shrink-0 text-green-600" />

              <p className="text-sm leading-6 text-green-700">
                Before and after photos help maintain service
                quality and booking records.
              </p>
            </div>
          </aside>
        </div>
      </main>
  );
}

export default ServiceProgressContent;
