import { Link } from "react-router-dom";
import { ArrowLeft, Car } from "lucide-react";
import RegistrationFields from "./RegistrationFields";

function RegistrationForm(props) {
  const { handleSubmit } = props;
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={17} /> Back to home
        </Link>
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><Car /></div>
            <p className="text-xl font-bold">WashNow</p>
          </div>
        </div>
        <p className="font-semibold text-blue-600">CREATE ACCOUNT</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">Start your car-care journey</h2>
        <p className="mt-3 text-slate-500">Enter your information to create your customer account.</p>
        <RegistrationFields {...props} form={{ ...props.form, handleSubmit }} />
        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegistrationForm;
