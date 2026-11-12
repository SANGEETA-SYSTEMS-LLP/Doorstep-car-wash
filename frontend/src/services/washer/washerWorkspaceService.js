import { apiRequest } from "../core/api";
export { ACTIVE_STATUSES, isActiveWasherJob, isCompletedWasherJob } from "./washerJobStatus";
export const getWasherWorkspace = () => apiRequest("/washer/workspace");
export const getWasherJob = bookingId => apiRequest("/washer/bookings/" + encodeURIComponent(bookingId) + "/details");
export const setWasherAvailability = online => apiRequest("/washer/availability", { method: "PATCH", body: JSON.stringify({ online }) });
export function toActiveJob(booking) {
  return {
    ...booking, id: booking.booking_number, databaseId: booking.id, service: booking.package?.name || "Car wash",
    customer: booking.customer, location: booking.location,
    vehicle: { ...booking.vehicle, name: [booking.vehicle?.brand, booking.vehicle?.model].filter(Boolean).join(" "), number: booking.vehicle?.vehicle_number, type: booking.vehicle?.vehicle_type },
    amount: booking.total_amount, time: booking.scheduled_start_time,
  };
}
