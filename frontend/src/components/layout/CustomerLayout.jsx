import CustomerProfileCompletion from "./CustomerProfileCompletion";
import { useAuth } from "../../context/AuthContext";
import { referenceId } from "../../services/shared/referenceId";
import { Outlet, useLocation } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import CustomerBookingNotifications from "./CustomerBookingNotifications";

function CustomerLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#f5f8fb]">
      <CustomerSidebar />

      <main className="min-h-screen lg:pl-64">
        <div className="flex min-h-11 items-center justify-end border-b border-slate-200/80 bg-white/90 px-5 py-2 sm:px-8">
          <p className="flex max-w-full items-center gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-400">Customer ID</span><span className="max-w-[55vw] truncate rounded-lg bg-slate-50 px-2.5 py-1 font-semibold tracking-wide text-slate-700 ring-1 ring-slate-200/80">{referenceId("CUS", user?.id) || "Unavailable"}</span></p>
        </div>
        <CustomerBookingNotifications key={user?.id || "signed-out"}>
          {pathname !== "/customer/profile" && <CustomerProfileCompletion key={user?.id || "guest"} />}
          <Outlet />
        </CustomerBookingNotifications>
      </main>
    </div>
  );
}

export default CustomerLayout;
