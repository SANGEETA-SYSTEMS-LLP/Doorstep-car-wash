import { supabaseAdmin } from "../config/supabase.js";
import { validateTicketInput, validateTicketUpdate, uuidPattern } from "../services/supportTicketService.js";

const ticketFields = "id, ticket_number, created_by, booking_id, issue_type, subject, description, status, priority, assigned_to, resolution_note, created_at, updated_at, resolved_at";

function handleSupportStorageError(error, res, next) {
  const missingSupportTable =
    ["PGRST205", "42P01"].includes(error.code) &&
    /support_tickets/i.test(`${error.message || ""} ${error.details || ""}`);

  if (missingSupportTable) {
    return res.status(503).json({
      success: false,
      message: "Support is temporarily unavailable. Please contact the site administrator.",
    });
  }

  return next(error);
}

async function canAccessBooking(bookingId, userId, role) {
  const isUuid = uuidPattern.test(bookingId);
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("id, customer_id, assigned_washer_id")
    .eq(isUuid ? "id" : "booking_number", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) return false;

  if (["support", "supervisor", "sub_admin", "super_admin"].includes(role)) return true;
  if (role === "customer") {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (customerError) throw customerError;
    return Boolean(customer && customer.id === booking.customer_id);
  }
  if (role === "washer") {
    const { data: washer, error: washerError } = await supabaseAdmin
      .from("washers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (washerError) throw washerError;
    return Boolean(washer && washer.id === booking.assigned_washer_id);
  }
  return false;
}

export async function createMyTicket(req, res, next) {
  try {
    const payload = validateTicketInput(req.body);
    if (payload.booking_id) {
      const hasAccess = await canAccessBooking(payload.booking_id, req.user.id, req.profile.role);
      if (!hasAccess) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }
      const isUuid = uuidPattern.test(payload.booking_id);
      if (!isUuid) {
        const { data: booking, error } = await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("booking_number", payload.booking_id)
          .single();
        if (error) throw error;
        payload.booking_id = booking.id;
      }
    }
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({ ...payload, created_by: req.user.id })
      .select(ticketFields)
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, ticket: data });
  } catch (error) {
    return handleSupportStorageError(error, res, next);
  }
}

export async function listMyTickets(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select(ticketFields)
      .eq("created_by", req.user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return res.json({ success: true, tickets: data || [] });
  } catch (error) {
    return handleSupportStorageError(error, res, next);
  }
}

export async function listSupportTickets(req, res, next) {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from("support_tickets")
      .select(ticketFields)
      .order("created_at", { ascending: false })
      .limit(200);
    if (status) {
      const validStatuses = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid ticket status filter." });
      }
      query = query.eq("status", status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, tickets: data || [] });
  } catch (error) {
    return handleSupportStorageError(error, res, next);
  }
}

export async function updateSupportTicket(req, res, next) {
  try {
    const { ticketId } = req.params;
    if (!uuidPattern.test(ticketId)) {
      return res.status(400).json({ success: false, message: "Invalid ticket ID." });
    }
    const payload = validateTicketUpdate(req.body);
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select(ticketFields)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }
    return res.json({ success: true, ticket: data });
  } catch (error) {
    return handleSupportStorageError(error, res, next);
  }
}
