
function JobInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

export default JobInfo;
