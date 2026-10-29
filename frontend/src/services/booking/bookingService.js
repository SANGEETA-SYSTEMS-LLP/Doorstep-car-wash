import { apiRequest } from "../core/api";

export async function createBooking({ userId, booking, requestId }) {
 if(!userId) throw new Error("Sign in to create a booking.");
 const result=await apiRequest("/customer/bookings",{method:"POST",body:JSON.stringify({requestId,addressId:booking.location?.addressId,vehicleId:booking.vehicle?.id,packageId:booking.package?.id,date:convertBookingDate(booking.schedule?.date),time:convertTimeTo24Hour(booking.schedule?.time),paymentMethod:booking.paymentMethod,promoCode:booking.promoCode || null})});
 return result.booking;
}

export async function getMyBookings(userId) {
  if (!userId) return [];
  const result = await apiRequest("/account/bookings");
  return result.bookings || [];
}

export async function removeBookingFromHistory(bookingId) {
  if (!bookingId) throw new Error("Booking ID is required.");
  return apiRequest(`/account/bookings/${encodeURIComponent(bookingId)}`, { method: "DELETE" });
}

export async function cancelBooking(bookingId) {
  if (!bookingId) throw new Error("Booking ID is required.");
  return apiRequest(`/customer/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST" });
}

export async function getBookingById(bookingId) {
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  const result = await apiRequest(
    `/customer/bookings/${encodeURIComponent(bookingId)}/details`
  );
  return result.booking;
}

export async function getBookingByNumber(bookingNumber) {
  if (!bookingNumber) {
    throw new Error("Booking number is required.");
  }
  const result = await apiRequest(`/customer/bookings/by-number/${encodeURIComponent(bookingNumber)}`);
  return result.booking;
}

function convertBookingDate(
  dateObject
) {
  /*
   * Current mock date structure:
   *
   * {
   *   date: "09",
   *   month: "Oct"
   * }
   */

  if (!dateObject) {
    throw new Error(
      "Invalid booking date."
    );
  }

  if (dateObject.iso) {
    return dateObject.iso;
  }

  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month =
    months[dateObject.month];

  if (!month) {
    throw new Error(
      "Invalid booking month."
    );
  }

  const day =
    String(dateObject.date).padStart(
      2,
      "0"
    );

  return `2026-${month}-${day}`;
}

function convertTimeTo24Hour(time) {
  if (!time) {
    throw new Error(
      "Invalid booking time."
    );
  }

  const match =
    time.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

  if (!match) {
    return time;
  }

  let hour =
    Number(match[1]);

  const minute =
    match[2];

  const period =
    match[3].toUpperCase();

  if (
    period === "PM" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "AM" &&
    hour === 12
  ) {
    hour = 0;
  }

  return `${String(hour).padStart(
    2,
    "0"
  )}:${minute}:00`;
}
