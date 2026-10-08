import { Route, Routes } from "react-router-dom";

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
function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* CUSTOMER */}

      <Route path="/customer" element={<CustomerLayout />}>

        <Route index element={<CustomerHome />} />

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
  element={<WasherLayout />}
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

      {/* NOT FOUND */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;