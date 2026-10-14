import { CheckCircle2 } from "lucide-react";

function ServiceCompletedHero({ completed, washer, packageName }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 size={42} />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-wider text-green-600">
        {completed ? "Booking Completed" : "Service Photos Submitted"}
      </p>
      <h1 className="mt-2 text-4xl font-bold">
        {completed ? "Your car wash is complete!" : "Your car wash is ready for validation"}
      </h1>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
        {washer?.name || "Your washer"} has marked your {packageName || "car wash"} as finished.
        {completed
          ? " The service was validated by the washer or supervisor."
          : " A washer or supervisor will validate the service photos to complete the booking."}
      </p>
    </div>
  );
}

export default ServiceCompletedHero;
