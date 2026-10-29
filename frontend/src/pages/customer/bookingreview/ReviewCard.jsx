
function ReviewCard({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
          {icon}
        </div>

        <div className="flex-1">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}

export default ReviewCard;
