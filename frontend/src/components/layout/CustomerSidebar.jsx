import ResponsiveNavigation from "./ResponsiveNavigation";
import { WashNowMark } from "./WashNowBrand";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Car,
  CircleHelp,
  Gift,
  History,
  Home,
  LogOut,
  MapPin,
  UserRound,
  ChevronRight,
} from "lucide-react";

const links = [
  {
    name: "Home",
    path: "/customer",
    icon: Home,
  },
  {
    name: "Book a Wash",
    path: "/customer/select-location",
    icon: MapPin,
  },
  {
    name: "Vehicles",
    path: "/customer/vehicles",
    icon: Car,
  },
  {
    name: "Booking History",
    path: "/customer/history",
    icon: History,
  },
  {
    name: "Offers",
    path: "/customer/offers",
    icon: Gift,
  },
  {
    name: "Support",
    path: "/customer/support",
    icon: CircleHelp,
  },
  {
    name: "Profile",
    path: "/customer/profile",
    icon: UserRound,
  },
];

function CustomerSidebar() {
  const { profile } = useAuth();
  const displayName = profile?.full_name || "Customer";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "C";
  return (
    <ResponsiveNavigation title="WashNow"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
        <WashNowMark />

        <div>
          <p className="font-black tracking-tight text-slate-950">WashNow</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Doorstep Car Care
          </p>
        </div>
      </div>

      <nav aria-label="Customer workspace" className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/customer"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#d5e9dc] bg-[#eaf4ed] text-[#183a2e] shadow-sm shadow-green-900/[0.03]"
                    : "border-transparent text-slate-600 hover:bg-[#f2f7f3] hover:text-[#183a2e]"
                }`
              }
            >
              <Icon size={19} />
              {item.name}
              <ChevronRight size={15} className="ml-auto opacity-0 transition-opacity group-hover:opacity-50" />
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-green-900 shadow-sm ring-1 ring-slate-100">{initials}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{displayName}</p><p className="mt-0.5 text-xs text-slate-500">Customer account</p></div>
        </div>
        <LinkButton />
      </div>
    </aside></ResponsiveNavigation>
  );
}

function LinkButton() {
  const { logout } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState("");
  async function leave(){try{await logout();navigate("/login",{replace:true});}catch(err){setError(err.message);}}
  return <><button onClick={leave} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={19}/>Logout</button>{error&&<p role="alert" className="px-4 text-sm text-red-600">{error}</p>}</>;
}
export default CustomerSidebar;
