import { lazy, Suspense, useEffect } from "react";
const SupervisorWasherDirectory = lazy(() => import("../pages/supervisor/washers/SupervisorWasherDirectory"));
const AddWasher = lazy(() => import("../pages/supervisor/washers/AddWasher"));
const WasherReviews = lazy(() => import("../pages/supervisor/washers/WasherReviews"));
const SupportDashboard = lazy(() => import("../pages/support/SupportDashboard"));
const AccountantDashboard = lazy(() => import("../pages/finance/accounting/AccountantDashboard"));
const FinanceOperations = lazy(() => import("../pages/finance/operations/FinanceOperations"));
const Reports = lazy(() => import("../pages/finance/reports/Reports"));
const Invoice = lazy(() => import("../pages/finance/invoices/Invoice"));
const OperationsMap = lazy(() => import("../pages/supervisor/operations/OperationsMap"));
const ResetPassword = lazy(() => import("../pages/public/resetpassword/ResetPassword"));
import { Navigate, Route, Routes, useParams, useLocation } from "react-router-dom";
import { apiRequest } from "../api/apiClient";
import RouteMetadata from "./RouteMetadata";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
const DashboardRedirect = lazy(() => import("../pages/public/DashboardRedirect"));
const Home = lazy(() => import("../pages/public/home/Home"));
const Login = lazy(() => import("../pages/public/login/Login"));
const Register = lazy(() => import("../pages/public/register/Register"));
const ForgotPassword = lazy(() => import("../pages/public/forgotpassword/ForgotPassword"));
const NotFound = lazy(() => import("../pages/public/notfound/NotFound"));
const LegalPage = lazy(() => import("../pages/public/legal/LegalPage"));
const CustomerLayout = lazy(() => import("../components/layout/CustomerLayout"));
const CustomerHome = lazy(() => import("../pages/customer/customerhome/CustomerHome"));
const SelectLocation = lazy(() => import("../pages/customer/selectlocation/SelectLocation"));
const SelectVehicle = lazy(() => import("../pages/customer/selectvehicle/SelectVehicle"));
const SelectPackage = lazy(() => import("../pages/customer/selectpackage/SelectPackage"));
const SelectSchedule = lazy(() => import("../pages/customer/selectschedule/SelectSchedule"));
const BookingReview = lazy(() => import("../pages/customer/bookingreview/BookingReview"));
const Payment = lazy(() => import("../pages/customer/payment/Payment"));
const BookingSuccess = lazy(() => import("../pages/customer/bookingsuccess/BookingSuccess"));
const FindingWasher = lazy(() => import("../pages/customer/findingwasher/FindingWasher"));
const TrackBooking = lazy(() => import("../pages/customer/trackbooking/TrackBooking"));
const WasherArrived = lazy(() => import("../pages/customer/washerarrived/WasherArrived"));
const ServiceProgress = lazy(() => import("../pages/customer/serviceprogress/ServiceProgress"));
const ServiceCompleted = lazy(() => import("../pages/customer/servicecompleted/ServiceCompleted"));
const RateService = lazy(() => import("../pages/customer/rateservice/RateService"));
const AddVehicle = lazy(() => import("../pages/customer/addvehicle/AddVehicle"));
const Vehicles = lazy(() => import("../pages/customer/vehicles/Vehicles"));
const BookingHistory = lazy(() => import("../pages/customer/bookinghistory/BookingHistory"));
const BookingDetails = lazy(() => import("../pages/customer/bookingdetails/BookingDetails"));
const Offers = lazy(() => import("../pages/customer/offers/Offers"));
const Support = lazy(() => import("../pages/customer/support/Support"));
const CustomerProfile = lazy(() => import("../pages/customer/customerprofile/CustomerProfile"));
const WasherLayout = lazy(() => import("../components/layout/WasherLayout"));
const WasherDashboard = lazy(() => import("../pages/washer/washerdashboard/WasherDashboard"));
const WasherJobs = lazy(() => import("../pages/washer/washerjobs/WasherJobs"));
const WasherJobDetails = lazy(() => import("../pages/washer/washerjobdetails/WasherJobDetails"));
const WasherNavigation = lazy(() => import("../pages/washer/washernavigation/WasherNavigation"));
const WasherService = lazy(() => import("../pages/washer/washerservice/WasherService"));
const WasherEarnings = lazy(() => import("../pages/washer/washerearnings/WasherEarnings"));
const WasherProfile = lazy(() => import("../pages/washer/washerprofile/WasherProfile"));
const SupervisorLayout = lazy(() => import("../components/layout/SupervisorLayout"));
const SupervisorDashboard = lazy(() => import("../pages/supervisor/dashboard/SupervisorDashboard"));
const SupervisorJobs = lazy(() => import("../pages/supervisor/jobs/SupervisorJobs"));
const SupervisorExtraCharges = lazy(() => import("../pages/supervisor/extra-charges/SupervisorExtraCharges"));
const SupervisorEscalations = lazy(() => import("../pages/supervisor/escalations/SupervisorEscalations"));
const SupervisorEscalationDetails = lazy(() => import("../pages/supervisor/escalations/SupervisorEscalationDetails"));
const SupervisorJobDetails = lazy(() => import("../pages/supervisor/jobs/SupervisorJobDetails"));
const SupervisorProfile = lazy(() => import("../pages/supervisor/profile/SupervisorProfile"));
const StaffConsoleLayout = lazy(() => import("../components/layout/StaffConsoleLayout"));
const SubAdminLayout = lazy(() => import("../components/layout/SubAdminLayout"));
const AccountantLayout = lazy(() => import("../components/layout/AccountantLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/dashboard/AdminDashboard"));
const AdminRoleDashboard = lazy(() => import("../pages/admin/dashboard/AdminRoleDashboard"));
const ResourcePage = lazy(() => import("../pages/admin/resources/ResourcePage"));
let lastReportedPagePath = null;

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

function RouteLoading() {
  return <main role="status" aria-label="Loading page" className="min-h-screen bg-slate-50 p-5 sm:p-8">
    <span className="sr-only">Loading page</span>
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="h-8 w-52 animate-pulse bg-slate-200" />
      <div className="h-4 w-80 max-w-full animate-pulse bg-slate-100" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse border border-slate-200 bg-[#fbfcfb]" />
        <div className="h-56 animate-pulse border border-slate-200 bg-[#fbfcfb]" />
      </div>
    </div>
  </main>;
}

function AppRoutes() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (lastReportedPagePath === pathname) return;
    lastReportedPagePath = pathname;
    apiRequest("/telemetry/page-view", {
      method: "POST",
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return (
    <>
    <RouteMetadata pathname={pathname} />
    <Suspense fallback={<RouteLoading />}>
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<LegalPage />} />
      <Route path="/privacy" element={<LegalPage />} />
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
            <RoleRoute allowedRoles={["super_admin"]} allowedEmail="ssadmin@sangeetasystems.com">
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
        <Route path="settlements" element={<Navigate to="/admin/finance" replace />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path="earnings" element={<Navigate to="/admin/washers" replace />} />
        <Route path=":resource" element={<ResourcePage />} />
      </Route>

      <Route path="/sub-admin" element={<ProtectedRoute><RoleRoute allowedRoles={["sub_admin"]}><SubAdminLayout /></RoleRoute></ProtectedRoute>}>
        <Route index element={<AdminRoleDashboard base="/sub-admin" />} />
        <Route path="support" element={<SupportDashboard />} />
        <Route path="operations" element={<OperationsMap />} />
        <Route path="accountant" element={<AccountantDashboard base="/sub-admin" />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path="earnings" element={<Navigate to="/sub-admin/washers" replace />} />
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
    </Suspense>
    </>
  );
}

export default AppRoutes;
