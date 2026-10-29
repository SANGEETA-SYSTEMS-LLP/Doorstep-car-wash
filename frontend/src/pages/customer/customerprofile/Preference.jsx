
function Preference({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      <div className="text-green-600">
        {icon}
      </div>

      <div className="flex-1">
        <p className="font-semibold">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        defaultChecked
        className="h-5 w-5"
      />
    </div>
  );
}

export default Preference;
