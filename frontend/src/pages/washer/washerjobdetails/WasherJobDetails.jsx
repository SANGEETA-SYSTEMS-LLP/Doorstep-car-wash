import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import WasherJobDetailsContent from "./WasherJobDetailsContent";

function WasherJobDetails() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back to Jobs
        </button>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-blue-600">
              {jobId}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Premium Wash
            </h1>
          </div>

          <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            Accepted
          </span>
        </div>

        <WasherJobDetailsContent navigate={navigate} jobId={jobId} />
      </div>
    </div>
  );
}

export default WasherJobDetails;
