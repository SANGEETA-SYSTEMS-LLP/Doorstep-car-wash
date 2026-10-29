import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Car, Droplets, ShieldCheck } from "lucide-react";

export default function SignupDropdown() {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  useEffect(() => {
    const close = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const finish = () => setOpen(false);
  const linkClass = "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-green-50 focus-visible:outline-green-600";
  return <div ref={container} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) finish(); }} onKeyDown={event => { if (event.key === "Escape") { finish(); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
      Sign up <ChevronDown size={16} />
    </button>
    {open && <div id={id} className="absolute right-0 top-full z-50 mt-3 w-64 rounded-lg border border-slate-200 bg-[#fbfcfb] p-2 shadow-md">
      <div className="px-3 pb-2 pt-1"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Choose your account</p></div>
      <Link to="/register?role=customer" onClick={finish} className={linkClass}><Car size={18} className="text-green-700" /><span><span className="block">Customer</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Book doorstep car care</span></span></Link>
      <Link to="/register?role=washer" onClick={finish} className={linkClass}><Droplets size={18} className="text-green-700" /><span><span className="block">Washer partner</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Manage jobs and earnings</span></span></Link>
      <Link to="/register?role=supervisor" onClick={finish} className={linkClass}><ShieldCheck size={18} className="text-slate-500" /><span><span className="block">Supervisor</span><span className="mt-0.5 block text-xs font-normal text-slate-500">Apply to manage local operations</span></span></Link>
    </div>}
  </div>;
}
