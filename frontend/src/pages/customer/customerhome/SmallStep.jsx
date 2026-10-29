
function SmallStep({ number, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-600">
        {number}
      </div>

      <span className="text-sm font-medium text-slate-700">
        {text}
      </span>
    </div>
  );
}

export default SmallStep;
