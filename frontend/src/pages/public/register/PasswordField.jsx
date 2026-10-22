import { Eye, EyeOff, LockKeyhole } from "lucide-react";

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  setVisible,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={19}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={name}
          autoComplete={"new-password"}
          required
          minLength={6}
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="Minimum 6 characters"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          aria-label={visible ? "Hide " + label.toLowerCase() : "Show " + label.toLowerCase()}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

export default PasswordField;
