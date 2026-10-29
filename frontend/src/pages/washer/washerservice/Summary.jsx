
function Summary({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-green-600">
        {icon}
      </div>

      <p className="mt-4 text-xs uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold">
        {value}
      </p>
    </div>
  );
}

export default Summary;
