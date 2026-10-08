import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import { packages } from "./data";

function SelectPackageContent({ booking, navigate, selected, setSelected, handleContinue }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={3} />

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <button
          onClick={() =>
            navigate("/customer/select-vehicle")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7 text-center">
          <p className="font-semibold text-blue-600">
            WASH PACKAGES
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Choose the right care for your car
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Package prices shown below are for your selected{" "}
            <span className="font-semibold text-slate-700">
              {booking.vehicle?.name || "vehicle"}
            </span>
            .
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packages.map((pkg) => {
            const active = selected === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`relative cursor-pointer rounded-3xl border-2 bg-white p-7 transition ${
                  active
                    ? "border-blue-600 shadow-xl shadow-blue-100"
                    : "border-slate-200 hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Sparkles />
                  </div>

                  {active && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check size={16} />
                    </div>
                  )}
                </div>

                <h2 className="mt-6 text-2xl font-bold">
                  {pkg.name}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {pkg.description}
                </p>

                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-bold">
                    ₹{pkg.price}
                  </span>

                  <span className="mb-1 text-sm text-slate-400">
                    / wash
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Clock3 size={17} />
                  Approx. {pkg.duration}
                </div>

                <div className="my-6 border-t border-slate-100" />

                <p className="mb-4 text-sm font-bold">
                  What's included
                </p>

                <div className="space-y-3">
                  {pkg.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-slate-600"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <Check size={13} />
                      </div>

                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelected(pkg.id)}
                  className={`mt-7 w-full rounded-xl py-3.5 font-semibold ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {active ? "Selected" : "Select Package"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-9 flex justify-end">
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectPackageContent;
