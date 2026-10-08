
function ProfileInput({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        <input
          required
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

export default ProfileInput;
