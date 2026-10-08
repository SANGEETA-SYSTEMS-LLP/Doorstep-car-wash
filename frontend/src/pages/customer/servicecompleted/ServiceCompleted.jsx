import { useNavigate } from "react-router-dom";
import {
  Car,
  CheckCircle2,
  Image,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useBooking } from "../../../context/BookingContext";

function ServiceCompleted() {
  const { booking, updateStatus } = useBooking();
  const washer = booking.washer;
  const servicePrice = booking.package?.price || 0;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl p-6 py-10 lg:p-8 lg:py-14">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={42} />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-green-600">
            Service Completed
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Your car is ready!
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
            {washer?.name || "Your washer"} has marked your{" "}
            {booking.package?.name || "car wash"} as completed.
            Please review the service before confirming completion.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <SummaryCard
            icon={<Car />}
            label="Vehicle"
            value={booking.vehicle?.name || "Vehicle"}
          />

          <SummaryCard
            icon={<Sparkles />}
            label="Service"
            value={booking.package?.name || "Car Wash"}
          />

          <SummaryCard
            icon={<ReceiptText />}
            label="Amount"
            value={`₹${servicePrice}`}
          />
        </div>

        {/* PHOTOS */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7">
          <div>
            <h2 className="text-xl font-bold">
              Service Photos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare the vehicle condition before and after the
              service.
            </p>
          </div>

          <div className="mt-7 grid gap-7 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold text-slate-500">
                Before Service
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Photo text="Front" />
                <Photo text="Rear" />
                <Photo text="Interior" />
                <Photo text="Side" />
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-green-600">
                After Service
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Photo text="Front" after />
                <Photo text="Rear" after />
                <Photo text="Interior" after />
                <Photo text="Side" after />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-5">
          <ShieldCheck className="shrink-0 text-green-600" />

          <div>
            <p className="font-semibold text-green-800">
              Please inspect your vehicle
            </p>

            <p className="mt-1 text-sm leading-6 text-green-700">
              Confirm completion only after you are satisfied with
              the service.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button className="flex-1 rounded-xl border border-red-200 bg-red-50 py-4 font-semibold text-red-600">
            Report an Issue
          </button>

          <button
            onClick={() => {
              updateStatus("customer_confirmed");
              navigate("/customer/rate-service");
            }}
            className="flex-1 rounded-xl bg-blue-600 py-4 font-semibold text-white"
          >
            Confirm Service Completion
          </button>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-blue-600">
        {icon}
      </div>

      <p className="mt-4 text-xs uppercase text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

function Photo({ text, after }) {
  return (
    <div
      className={`flex aspect-video flex-col items-center justify-center rounded-xl ${
        after
          ? "bg-green-50 text-green-500"
          : "bg-slate-100 text-slate-400"
      }`}
    >
      <Image />

      <span className="mt-2 text-xs font-medium">
        {text}
      </span>
    </div>
  );
}

export default ServiceCompleted;