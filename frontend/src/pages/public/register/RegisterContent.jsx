import RegistrationBrandPanel from "./RegistrationBrandPanel";
import RegistrationForm from "./RegistrationForm";

function RegisterContent(props) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
      <RegistrationBrandPanel />
      <RegistrationForm {...props} />
    </div>
  );
}

export default RegisterContent;
