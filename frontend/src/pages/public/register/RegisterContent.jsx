import RegistrationBrandPanel from "./RegistrationBrandPanel";
import RegistrationForm from "./RegistrationForm";
export default function RegisterContent(props) {
  return <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
    <RegistrationBrandPanel accountType={props.accountType} />
    <RegistrationForm {...props} />
  </main>;
}
