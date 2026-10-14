import { useAuth } from "../../context/AuthContext";
import { referenceId } from "../../services/referenceId";
import { Outlet } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";
import CustomerBookingNotifications from "./CustomerBookingNotifications";

function CustomerLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerSidebar />
      <CustomerBookingNotifications />

      <main className="min-h-screen lg:pl-64">
        <div className="break-all border-b border-slate-200 bg-white px-6 py-3 text-xs text-slate-500">Customer ID: {referenceId("CUS", user?.id) || "Unavailable"}</div>
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;