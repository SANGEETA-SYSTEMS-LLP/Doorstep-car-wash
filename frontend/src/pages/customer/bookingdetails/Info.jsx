
function Info({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="text-blue-600">{icon}</div>

      <div>
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

export default Info;
