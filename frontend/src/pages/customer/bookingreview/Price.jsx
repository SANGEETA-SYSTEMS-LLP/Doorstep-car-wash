
function Price({ label, amount, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={`font-semibold ${
          green ? "text-green-600" : ""
        }`}
      >
        {amount}
      </span>
    </div>
  );
}

export default Price;
