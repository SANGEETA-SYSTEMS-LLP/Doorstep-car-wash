import { supabaseAdmin as db } from "../../config/supabase.js";
import { getSupervisorAreaBookingIds, isWithinSupervisorArea } from "../../services/supervisor/supervisorServiceArea.js";

async function allRows(table, columns, filters = []) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    let query = db.from(table).select(columns).range(offset, offset + 999);
    for (const [method, ...args] of filters) query = query[method](...args);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

export async function getSupervisorWasherRoster(req, res, next) {
  try {
    const washerFilters = req.profile?.role === "supervisor"
      ? [["eq", "supervisor_id", req.user.id]]
      : [];
    let washers = await allRows("washers", "id,user_id,supervisor_id,status,is_active,is_verified,rating,jobs_completed,current_address", washerFilters);
    if (req.profile?.role === "supervisor") {
      const points = await allRows("washer_locations", "washer_id,latitude,longitude,service_latitude,service_longitude");
      const localIds = new Set(points.filter(point => isWithinSupervisorArea({
        latitude: point.service_latitude ?? point.latitude,
        longitude: point.service_longitude ?? point.longitude,
      }, req.supervisorArea)).map(point => point.washer_id));
      washers = washers.filter(washer => localIds.has(washer.id));
    }
    const userIds = [...new Set(washers.map(washer => washer.user_id).filter(Boolean))];
    const profiles = [];
    for (let offset = 0; offset < userIds.length; offset += 500) {
      const { data, error } = await db.from("profiles").select("id,full_name,phone,role,is_active")
        .in("id", userIds.slice(offset, offset + 500));
      if (error) throw error;
      profiles.push(...(data || []));
    }

    let areaBookingIds = null;
    if (req.profile?.role === "supervisor") areaBookingIds = await getSupervisorAreaBookingIds(req.supervisorArea);
    const [bookingRows, assignmentRows, earningRows, payoutAccounts] = await Promise.all([
      allRows("bookings", "id,assigned_washer_id,status", [["not", "assigned_washer_id", "is", null]]),
      allRows("booking_assignments", "booking_id,washer_id,status", [["eq", "status", "accepted"]]),
      allRows("washer_earnings", "washer_id,booking_id,gross_amount,platform_commission,washer_amount,status"),
      washers.length ? allRows("washer_payout_accounts", "washer_id,account_label,updated_at") : Promise.resolve([]),
    ]);
    let bookings = bookingRows;
    let localBookingIds = areaBookingIds ? new Set(areaBookingIds) : null;
    if (req.profile?.role === "supervisor") {
      bookings = bookingRows.filter(booking => localBookingIds.has(booking.id));
    }
    const acceptedAssignments = req.profile?.role === "supervisor" ? assignmentRows.filter(row => localBookingIds.has(row.booking_id)) : assignmentRows;
    const earnings = req.profile?.role === "supervisor"
      ? earningRows.filter(row => washers.some(washer => washer.id === row.washer_id) && (!row.booking_id || localBookingIds.has(row.booking_id)))
      : earningRows;
    const payoutByWasher = new Map(payoutAccounts.map(account => [account.washer_id, account]));

    const profileByUserId = new Map(profiles.map(profile => [profile.id, profile]));
    const jobsByWasher = new Map();
    for (const job of bookings) {
      if (!job.assigned_washer_id) continue;
      const current = jobsByWasher.get(job.assigned_washer_id) || { assignedJobs: 0, activeJobs: 0, completedJobs: 0 };
      current.assignedJobs += 1;
      if (["washer_assigned", "washer_on_the_way", "washer_arrived", "otp_verified", "service_started", "service_completed"].includes(job.status)) current.activeJobs += 1;
      if (["completed", "customer_confirmed", "payment_completed", "closed"].includes(job.status)) current.completedJobs += 1;
      jobsByWasher.set(job.assigned_washer_id, current);
    }

    const assignmentsByWasher = new Map();
    for (const assignment of acceptedAssignments) {
      if (!assignment.washer_id) continue;
      const current = assignmentsByWasher.get(assignment.washer_id) || new Set();
      current.add(assignment.booking_id);
      assignmentsByWasher.set(assignment.washer_id, current);
    }

    const earningsByWasher = new Map();
    for (const earning of earnings) {
      const amount = Number(earning.washer_amount);
      if (!Number.isFinite(amount) || !earning.washer_id) continue;
      const current = earningsByWasher.get(earning.washer_id) || { grossEarnings: 0, platformCommission: 0, totalEarnings: 0, pendingEarnings: 0, settledEarnings: 0, pendingPayoutCount: 0, paidPayoutCount: 0 };
      current.grossEarnings += Number(earning.gross_amount || 0);
      current.platformCommission += Number(earning.platform_commission || 0);
      current.totalEarnings += amount;
      if (earning.status === "pending") { current.pendingEarnings += amount; current.pendingPayoutCount += 1; }
      if (earning.status === "settled") { current.settledEarnings += amount; current.paidPayoutCount += 1; }
      earningsByWasher.set(earning.washer_id, current);
    }

    const roster = washers.map(washer => {
      const profile = profileByUserId.get(washer.user_id);
      const jobStats = jobsByWasher.get(washer.id) || { assignedJobs: 0, activeJobs: 0, completedJobs: 0 };
      const earningStats = earningsByWasher.get(washer.id) || { grossEarnings: 0, platformCommission: 0, totalEarnings: 0, pendingEarnings: 0, settledEarnings: 0 };
      const payout = payoutByWasher.get(washer.id);
      const isUpiPayout = /^UPI •••• @[A-Za-z0-9.-]{2,64}$/.test(payout?.account_label || "");
      const safePayoutDestination = isUpiPayout
        ? payout.account_label
        : /^Bank account •••• \d{4} \([A-Z]{4}0[A-Z0-9]{6}\)$/.test(payout?.account_label || "")
          ? payout.account_label
          : payout ? "Bank account (linked)" : null;
      return {
        id: washer.id,
        userId: washer.user_id,
        name: profile?.full_name?.trim() || "Name not provided",
        phone: profile?.phone || null,
        role: profile?.role || null,
        active: Boolean(washer.is_active && profile?.is_active),
        verified: Boolean(washer.is_verified),
        status: washer.status || "offline",
        rating: Number(washer.rating || 0),
        profileJobsCompleted: Number(washer.jobs_completed || 0),
        address: washer.current_address || null,
        acceptedAssignments: assignmentsByWasher.get(washer.id)?.size || 0,
        ...jobStats,
        payoutMethod: payout ? isUpiPayout ? "UPI (RazorpayX)" : "Bank transfer (RazorpayX)" : "Not configured",
        payoutDestination: safePayoutDestination,
        payoutAccountUpdatedAt: payout?.updated_at || null,
        ...Object.fromEntries(Object.entries(earningStats).map(([key, value]) => [key, Number(value.toFixed(2))])),
      };
    }).sort((a, b) => Number(b.active) - Number(a.active) || b.acceptedAssignments - a.acceptedAssignments || a.name.localeCompare(b.name));

    const summary = roster.reduce((result, washer) => {
      result.washers += 1;
      if (!washer.active) result.inactive += 1;
      if (washer.active && washer.verified) result.verified += 1;
      if (washer.active && !washer.verified) result.pendingVerification += 1;
      if (washer.active && washer.status === "available") result.online += 1;
      result.acceptedAssignments += washer.acceptedAssignments;
      result.activeJobs += washer.activeJobs;
      result.grossEarnings += washer.grossEarnings;
      result.platformCommission += washer.platformCommission;
      result.totalEarnings += washer.totalEarnings;
      result.pendingEarnings += washer.pendingEarnings;
      result.pendingPayout += washer.pendingEarnings;
      result.settledEarnings += washer.settledEarnings;
      return result;
    }, { washers: 0, online: 0, verified: 0, pendingVerification: 0, inactive: 0, acceptedAssignments: 0, activeJobs: 0, grossEarnings: 0, platformCommission: 0, totalEarnings: 0, pendingEarnings: 0, pendingPayout: 0, settledEarnings: 0 });

    for (const key of ["grossEarnings", "platformCommission", "totalEarnings", "pendingEarnings", "pendingPayout", "settledEarnings"]) summary[key] = Number(summary[key].toFixed(2));
    return res.json({ success: true, summary, washers: roster });
  } catch (error) {
    next(error);
  }
}
