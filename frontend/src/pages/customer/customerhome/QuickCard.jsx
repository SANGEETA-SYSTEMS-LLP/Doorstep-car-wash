
import { Link } from "react-router-dom";

function QuickCard({ icon, title, value, text, to }) {
  const content = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
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
        className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors duration-150 hover:border-green-200 focus:outline-none focus:ring-4 focus:ring-green-600/10"
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
