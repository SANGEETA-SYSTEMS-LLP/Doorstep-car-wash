import { Outlet } from "react-router-dom";
import CustomerSidebar from "./CustomerSidebar";

function CustomerLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerSidebar />

      <main className="min-h-screen lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;