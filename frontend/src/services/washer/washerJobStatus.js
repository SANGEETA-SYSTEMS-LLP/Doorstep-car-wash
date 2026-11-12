export const ACTIVE_STATUSES = ["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started", "service_completed"];

export function isActiveWasherJob(job) {
  return ACTIVE_STATUSES.includes(job?.status)
    && !(job.status === "service_completed" && job.service_validated_at);
}

export function isCompletedWasherJob(job) {
  return ["completed", "customer_confirmed", "payment_completed", "closed"].includes(job?.status)
    || (job?.status === "service_completed" && Boolean(job.service_validated_at));
}
