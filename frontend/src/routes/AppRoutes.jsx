import SupervisorWasherDirectory from "../pages/supervisor/washers/SupervisorWasherDirectory";
import AddWasher from "../pages/supervisor/washers/AddWasher";
import WasherReviews from "../pages/supervisor/washers/WasherReviews";
import SupportDashboard from "../pages/support/SupportDashboard";
import AccountantDashboard from "../pages/finance/accounting/AccountantDashboard";
import FinanceOperations from "../pages/finance/operations/FinanceOperations";
import Reports from "../pages/finance/reports/Reports";
import Invoice from "../pages/finance/invoices/Invoice";
import OperationsMap from "../pages/supervisor/operations/OperationsMap";
import ResetPassword from "../pages/public/resetpassword/ResetPassword";
import { Navigate, Route, Routes, useParams, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import DashboardRedirect from "../pages/public/DashboardRedirect";

import Home from "../pages/public/home/Home";
import Login from "../pages/public/login/Login";
import Register from "../pages/public/register/Register";
import ForgotPassword from "../pages/public/forgotpassword/ForgotPassword";
import NotFound from "../pages/public/notfound/NotFound";

import CustomerLayout from "../components/layout/CustomerLayout";

import CustomerHome from "../pages/customer/customerhome/CustomerHome";
import SelectLocation from "../pages/customer/selectlocation/SelectLocation";
import SelectVehicle from "../pages/customer/selectvehicle/SelectVehicle";
import SelectPackage from "../pages/customer/selectpackage/SelectPackage";
import SelectSchedule from "../pages/customer/selectschedule/SelectSchedule";
import BookingReview from "../pages/customer/bookingreview/BookingReview";
import Payment from "../pages/customer/payment/Payment";
import BookingSuccess from "../pages/customer/bookingsuccess/BookingSuccess";
import FindingWasher from "../pages/customer/findingwasher/FindingWasher";
import TrackBooking from "../pages/customer/trackbooking/TrackBooking";
import WasherArrived from "../pages/customer/washerarrived/WasherArrived";
import ServiceProgress from "../pages/customer/serviceprogress/ServiceProgress";
import ServiceCompleted from "../pages/customer/servicecompleted/ServiceCompleted";
import RateService from "../pages/customer/rateservice/RateService";
import AddVehicle from "../pages/customer/addvehicle/AddVehicle";
import Vehicles from "../pages/customer/vehicles/Vehicles";
import BookingHistory from "../pages/customer/bookinghistory/BookingHistory";
import BookingDetails from "../pages/customer/bookingdetails/BookingDetails";
import Offers from "../pages/customer/offers/Offers";
import Support from "../pages/customer/support/Support";
import CustomerProfile from "../pages/customer/customerprofile/CustomerProfile";
import WasherLayout from "../components/layout/WasherLayout";

import WasherDashboard from "../pages/washer/washerdashboard/WasherDashboard";
import WasherJobs from "../pages/washer/washerjobs/WasherJobs";
import WasherJobDetails from "../pages/washer/washerjobdetails/WasherJobDetails";
import WasherNavigation from "../pages/washer/washernavigation/WasherNavigation";
import WasherService from "../pages/washer/washerservice/WasherService";
import WasherEarnings from "../pages/washer/washerearnings/WasherEarnings";
import WasherProfile from "../pages/washer/washerprofile/WasherProfile";
import SupervisorLayout from "../components/layout/SupervisorLayout";
import SupervisorDashboard from "../pages/supervisor/dashboard/SupervisorDashboard";
import SupervisorJobs from "../pages/supervisor/jobs/SupervisorJobs";
import SupervisorExtraCharges from "../pages/supervisor/extra-charges/SupervisorExtraCharges";
import SupervisorEscalations from "../pages/supervisor/escalations/SupervisorEscalations";
import SupervisorEscalationDetails from "../pages/supervisor/escalations/SupervisorEscalationDetails";
import SupervisorJobDetails from "../pages/supervisor/jobs/SupervisorJobDetails";
import SupervisorProfile from "../pages/supervisor/profile/SupervisorProfile";
import StaffConsoleLayout from "../components/layout/StaffConsoleLayout";
import SubAdminLayout from "../components/layout/SubAdminLayout";
import AccountantLayout from "../components/layout/AccountantLayout";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import AdminRoleDashboard from "../pages/admin/dashboard/AdminRoleDashboard";
import ResourcePage from "../pages/admin/resources/ResourcePage";

function LegacyAccountantRedirect() {
  const {resource} = useParams();
  const {search, hash} = useLocation();
  const path = ["payments","earnings","settlements","finance","reports","invoices"].includes(resource) ? "/" + resource : "";
  return <Navigate to={"/accountant" + path + search + hash} replace />;
}
function LegacyAccountantHomeRedirect() {
  const {search, hash} = useLocation();
  return <Navigate to={"/accountant" + search + hash} replace />;
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* PUBLIC */}

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* CUSTOMER */}

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["customer"]}>
              <CustomerLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >

        <Route index element={<CustomerHome />} />
        <Route path="invoices/:bookingId" element={<Invoice />} />

        <Route
          path="select-location"
          element={<SelectLocation />}
        />

        <Route
          path="select-vehicle"
          element={<SelectVehicle />}
        />

        <Route
          path="select-package"
          element={<SelectPackage />}
        />

        <Route
          path="select-schedule"
          element={<SelectSchedule />}
        />
        <Route
  path="booking-review"
  element={<BookingReview />}
/>
        <Route
  path="payment"
  element={<Payment />}
  
/>
        <Route
  path="booking-success"
  element={<BookingSuccess />}
/>
<Route
  path="finding-washer"
  element={<FindingWasher />}
/>
<Route
  path="track-booking"
  element={<TrackBooking />}
/>
<Route
  path="washer-arrived"
  element={<WasherArrived />}
/>

<Route
  path="service-progress"
  element={<ServiceProgress />}
/>

<Route
  path="service-completed"
  element={<ServiceCompleted />}
/>

<Route
  path="rate-service"
  element={<RateService />}
/>
<Route
  path="vehicles"
  element={<Vehicles />}
/>

<Route
  path="vehicles/add"
  element={<AddVehicle />}
/>

<Route
  path="history"
  element={<BookingHistory />}
/>

<Route
  path="bookings/:bookingId"
  element={<BookingDetails />}
/>

<Route
  path="offers"
  element={<Offers />}
/>

<Route
  path="support"
  element={<Support />}
/>

<Route
  path="profile"
  element={<CustomerProfile />}
/>

      </Route>
      <Route
  path="/washer"
  element={
    <ProtectedRoute>
      <RoleRoute allowedRoles={["washer"]}>
        <WasherLayout />
      </RoleRoute>
    </ProtectedRoute>
  }
>
  <Route
    index
    element={<WasherDashboard />}
  />

  <Route
    path="jobs"
    element={<WasherJobs />}
  />

  <Route
    path="jobs/:jobId"
    element={<WasherJobDetails />}
  />
  <Route
  path="jobs/:jobId/navigation"
  element={<WasherNavigation />}
/>

<Route
  path="jobs/:jobId/service"
  element={<WasherService />}
/>
<Route
  path="earnings"
  element={<WasherEarnings />}
/>

<Route
  path="profile"
  element={<WasherProfile />}
/>
</Route>

      <Route
        path="/supervisor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["supervisor", "sub_admin", "super_admin"]}>
              <SupervisorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<SupervisorDashboard />}
        />

        <Route path="washers" element={<SupervisorWasherDirectory />} />

        <Route
          path="jobs"
          element={<SupervisorJobs />}
        />

        <Route
          path="jobs/:bookingId"
          element={<SupervisorJobDetails />}
        />

        <Route path="washers/review" element={<WasherReviews />} />
        <Route path="washers/add" element={<AddWasher />} />
        <Route path="operations" element={<OperationsMap />} />
        <Route
          path="extra-charges"
          element={<SupervisorExtraCharges />}
        />

        <Route
          path="escalations"
          element={<SupervisorEscalations />}
        />

        <Route
          path="escalations/:bookingId"
          element={<SupervisorEscalationDetails />}
        />

        <Route
          path="profile"
          element={<SupervisorProfile />}
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["super_admin"]}>
              <StaffConsoleLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="support" element={<SupportDashboard />} />
        <Route path="operations" element={<OperationsMap />} />
        <Route path="accountant" element={<AccountantDashboard />} />
        <Route path="super-admin" element={<Navigate to="/admin" replace />} />
        <Route path="sub-admin" element={<AdminRoleDashboard />} />
        <Route path="finance" element={<RoleRoute allowedRoles={["super_admin"]}><FinanceOperations /></RoleRoute>} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path=":resource" element={<ResourcePage />} />
      </Route>

      <Route path="/sub-admin" element={<ProtectedRoute><RoleRoute allowedRoles={["sub_admin"]}><SubAdminLayout /></RoleRoute></ProtectedRoute>}>
        <Route index element={<AdminRoleDashboard base="/sub-admin" />} />
        <Route path="support" element={<SupportDashboard />} />
        <Route path="operations" element={<OperationsMap />} />
        <Route path="accountant" element={<AccountantDashboard base="/sub-admin" />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path=":resource" element={<ResourcePage base="admin" />} />
      </Route>

      <Route path="/accountant" element={<ProtectedRoute><RoleRoute allowedRoles={["accountant", "supervisor", "sub_admin", "super_admin"]}><AccountantLayout /></RoleRoute></ProtectedRoute>}>
        <Route index element={<AccountantDashboard base="/accountant" />} />
        <Route path="payments" element={<ResourcePage base="accountant" resource="payments" />} />
        <Route path="earnings" element={<ResourcePage base="accountant" resource="earnings" />} />
        <Route path="settlements" element={<ResourcePage base="accountant" resource="settlements" />} />
        <Route path="finance" element={<RoleRoute allowedRoles={["accountant", "super_admin"]}><FinanceOperations /></RoleRoute>} />
        <Route path="reports" element={<RoleRoute allowedRoles={["accountant", "sub_admin", "super_admin"]}><Reports /></RoleRoute>} />
        <Route path="invoices" element={<RoleRoute allowedRoles={["accountant", "sub_admin", "super_admin"]}><Invoice /></RoleRoute>} />
      </Route>
      <Route path="/supervisor/accountant" element={<LegacyAccountantHomeRedirect />} />
      <Route path="/supervisor/accountant/:resource" element={<LegacyAccountantRedirect />} />

      <Route path="/support" element={<ProtectedRoute><RoleRoute allowedRoles={["support", "sub_admin", "super_admin"]}><StaffConsoleLayout /></RoleRoute></ProtectedRoute>}><Route index element={<SupportDashboard />} /></Route>
      {/* NOT FOUND */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
