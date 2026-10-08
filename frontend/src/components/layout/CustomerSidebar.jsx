import { NavLink } from "react-router-dom";
import {
  Car,
  CircleHelp,
  Gift,
  History,
  Home,
  LogOut,
  MapPin,
  UserRound,
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
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Car size={21} />
        </div>

        <div>
          <p className="font-bold">WashNow</p>
          <p className="text-xs text-slate-500">
            Doorstep Car Care
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/customer"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <LinkButton />
      </div>
    </aside>
  );
}

function LinkButton() {
  return (
    <NavLink
      to="/login"
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
    >
      <LogOut size={19} />
      Logout
    </NavLink>
  );
}

export default CustomerSidebar;