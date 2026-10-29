import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
import { WashNowMark } from "./WashNowBrand";

export default function ResponsiveNavigation({ children, title = "WashNow" }) {
  const disclosure = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { if (disclosure.current) disclosure.current.open = false; }, [pathname]);
  return <>
    <div className="desktop-navigation hidden lg:contents">{children}</div>
    <details ref={disclosure} className="mobile-navigation border-b border-slate-200 bg-[#f8faf9] lg:hidden" onKeyDown={event => { if(event.key === "Escape") { disclosure.current.open = false; disclosure.current.querySelector("summary")?.focus(); } }}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3">
        <WashNowMark className="h-10 w-10" />
        <span className="flex-1 font-bold tracking-tight text-slate-900">{title}</span><Menu size={20} className="text-slate-500"/><ChevronDown size={15} className="text-slate-400"/>
      </summary>
      <div className="mobile-navigation-content max-h-[70dvh] overflow-y-auto border-t border-slate-100">{children}</div>
    </details>
  </>;
}
