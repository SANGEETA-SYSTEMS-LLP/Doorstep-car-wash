import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { serviceSteps } from "./data";
import ServiceProgressContent from "./ServiceProgressContent";

function ServiceProgress() {
  const { booking, updateStatus } = useBooking();
  const washer = booking.washer;
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    updateStatus("service_started");

    if (currentStep < serviceSteps.length - 1) {
      setCurrentStep((previous) => previous + 1);
      return;
    }

    updateStatus("service_completed");
    navigate("/customer/service-completed");
  };

  const progress =
    ((currentStep + 1) / serviceSteps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              CW-2026-1028
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Service In Progress
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            In Progress
          </div>
        </div>
      </header>

      <ServiceProgressContent booking={booking} washer={washer} currentStep={currentStep} nextStep={nextStep} progress={progress} />
    </div>
  );
}

export default ServiceProgress;
