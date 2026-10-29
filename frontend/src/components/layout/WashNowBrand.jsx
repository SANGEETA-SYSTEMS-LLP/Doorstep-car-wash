import { Link } from "react-router-dom";

export function WashNowMark({ className = "" }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-700 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 44 44" className="h-7 w-7" fill="none">
        <path d="M7 25.5h3.2l2.3-6.1c.4-1.1 1.4-1.8 2.6-1.8h13.5c1.1 0 2 .5 2.6 1.4l3.5 5.2 3.2 1.3v5.2H7v-5.2Z" stroke="white" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M15 18.2 17.6 14h8.8l3 4.2" stroke="#87c5a6" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14.2" cy="30.6" r="2.4" fill="#87c5a6" />
        <circle cx="31.7" cy="30.6" r="2.4" fill="#87c5a6" />
      </svg>
    </span>
  );
}

export function WashNowBrand({
  to = "/",
  subtitle = "Doorstep Car Care",
  light = false,
  className = "",
  markClassName = "",
}) {
  return (
    <Link to={to} className={`inline-flex w-fit items-center gap-3 ${className}`} aria-label="WashNow home">
      <WashNowMark className={markClassName} />
      <span className="leading-tight">
        <span className={`block text-lg font-black tracking-tight ${light ? "text-white" : "text-slate-950"}`}>WashNow</span>
        {subtitle && <span className={`mt-1 block text-xs ${light ? "text-green-100" : "text-slate-500"}`}>{subtitle}</span>}
      </span>
    </Link>
  );
}
