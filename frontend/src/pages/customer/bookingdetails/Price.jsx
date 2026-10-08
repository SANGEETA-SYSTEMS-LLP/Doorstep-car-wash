
function Price({ label, value, bold }) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "text-lg font-bold" : "text-sm"
      }`}
    >
      <span className={bold ? "" : "text-slate-500"}>
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}

export default Price;
