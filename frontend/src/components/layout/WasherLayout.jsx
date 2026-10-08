import { Outlet } from "react-router-dom";
import {
  Bell,
  Menu,
  ShieldCheck,
} from "lucide-react";
import WasherSidebar from "./WasherSidebar";

function WasherLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <WasherSidebar />

      <div className="min-w-0 flex-1">
        {/* TOP BAR */}

        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:hidden">
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm font-bold">
                Washer Partner
              </p>

              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <ShieldCheck size={13} />
                Verified account
              </div>
            </div>
          </div>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200">
            <Bell size={19} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WasherLayout;