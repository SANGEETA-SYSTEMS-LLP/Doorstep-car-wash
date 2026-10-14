import { CheckCircle2 } from "lucide-react";

function WasherArrivalIntro({ washer }) {
  return (
    <div className="rounded-3xl border border-green-200 bg-green-50 p-7 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="mt-5 text-3xl font-bold text-green-900">Your washer has arrived!</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-green-700">
        {washer?.name || "Assigned Washer"} has reached your service location. Please meet the washer and verify the service using your OTP.
      </p>
    </div>
  );
}

export default WasherArrivalIntro;
