
function SummaryRow({ label, value, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={`font-semibold ${
          green ? "text-green-600" : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default SummaryRow;
