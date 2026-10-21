
import { Link } from "react-router-dom";

function QuickCard({ icon, title, value, text, to }) {
  const content = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-600/10"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">{content}</div>
  );
}

export default QuickCard;
