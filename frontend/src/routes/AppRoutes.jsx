import FinanceOperations from "../pages/finance/FinanceOperations";
import Reports from "../pages/finance/Reports";
import Invoice from "../pages/finance/Invoice";
import OperationsMap from "../pages/supervisor/OperationsMap";
import ResetPassword from "../pages/public/resetpassword/ResetPassword";
import { Navigate, Route, Routes } from "react-router-dom";
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
import SelectVehicle from "../pages/customer/selectvechicle/SelectVehicle";
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
import Offers from "../pages/customer/offer/Offers";
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
import SupervisorLayout from "../layouts/SupervisorLayout";
import SupervisorDashboard from "../pages/supervisor/SupervisorDashboard";
import SupervisorJobs from "../pages/supervisor/SupervisorJobs";
import SupervisorExtraCharges from "../pages/supervisor/SupervisorExtraCharges";
import SupervisorEscalations from "../pages/supervisor/SupervisorEscalations";
import SupervisorEscalationDetails from "../pages/supervisor/SupervisorEscalationDetails";
import SupervisorJobDetails from "../pages/supervisor/SupervisorJobDetails";
import SupervisorProfile from "../pages/supervisor/SupervisorProfile";
import StaffConsoleLayout from "../layouts/StaffConsoleLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ResourcePage from "../pages/admin/ResourcePage";

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
            <RoleRoute allowedRoles={["supervisor"]}>
              <SupervisorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<SupervisorDashboard />}
        />

        <Route
          path="jobs"
          element={<SupervisorJobs />}
        />

        <Route
          path="jobs/:bookingId"
          element={<SupervisorJobDetails />}
        />

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
            <RoleRoute allowedRoles={["sub_admin", "super_admin"]}>
              <StaffConsoleLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="finance" element={<FinanceOperations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path=":resource" element={<ResourcePage />} />
      </Route>

      <Route
        path="/accountant"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["accountant", "sub_admin", "super_admin"]}>
              <StaffConsoleLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="payments" replace />} />
        <Route path="finance" element={<FinanceOperations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="invoices" element={<Invoice />} />
        <Route path=":resource" element={<ResourcePage base="accountant" />} />
      </Route>

      {/* NOT FOUND */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;