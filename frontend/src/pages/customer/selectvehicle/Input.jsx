
function Input({ label, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-green-500"
      />
    </div>
  );
}

export default Input;
