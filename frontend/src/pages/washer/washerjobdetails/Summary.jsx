
function Summary({
  label,
  value,
  green,
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-sm font-bold ${
          green
            ? "text-green-600"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default Summary;
