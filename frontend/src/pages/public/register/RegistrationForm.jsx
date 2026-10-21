import { Link } from "react-router-dom";
import { ArrowLeft, Car } from "lucide-react";
import RegistrationFields from "./RegistrationFields";

function RegistrationForm(props) {
  const { handleSubmit } = props;
  return (
    <div className="flex min-w-0 items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
      <div className="w-full max-w-2xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft size={17} /> Back to home
        </Link>
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><Car /></div>
            <p className="text-xl font-bold">WashNow</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-blue-600">{props.accountType.toUpperCase()} SIGN UP</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{props.accountType !== "customer" ? "Join as a " + props.accountType : "Create your account"}</h2>
        <p className="mt-3 text-slate-500">{props.accountType !== "customer" ? "Register your details. An administrator must activate your " + props.accountType + " access." : "A few details now. Effortless car care starts here."}</p>
        <RegistrationFields {...props} form={{ ...props.form, handleSubmit }} />
        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600">Login</Link>
        </p>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;
