const issueTypes = new Set([
  "booking_issue",
  "washer_issue",
  "payment_issue",
  "refund_request",
  "service_quality",
  "additional_charge",
  "other",
]);

const statuses = new Set([
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
]);

const priorities = new Set(["low", "normal", "high", "urgent"]);
export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function validateTicketInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw Object.assign(new Error("Ticket details are required."), { status: 400 });
  }

  const { bookingId = null, issueType, subject, description } = input;
  if (bookingId !== null && (typeof bookingId !== "string" || !/^[a-z0-9-]{3,64}$/i.test(bookingId.trim()))) {
    throw Object.assign(new Error("Enter a valid booking ID or booking number."), { status: 400 });
  }
  if (!issueTypes.has(issueType)) {
    throw Object.assign(new Error("Choose a valid issue type."), { status: 400 });
  }
  if (typeof subject !== "string" || subject.trim().length < 3 || subject.trim().length > 160) {
    throw Object.assign(new Error("Subject must be between 3 and 160 characters."), { status: 400 });
  }
  if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 5000) {
    throw Object.assign(new Error("Description must be between 10 and 5000 characters."), { status: 400 });
  }

  return {
    booking_id: bookingId?.trim() || null,
    issue_type: issueType,
    subject: subject.trim(),
    description: description.trim(),
  };
}

export function validateTicketUpdate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw Object.assign(new Error("Ticket update is required."), { status: 400 });
  }
  const output = {};

  if ("status" in input) {
    if (!statuses.has(input.status)) {
      throw Object.assign(new Error("Invalid ticket status."), { status: 400 });
    }
    output.status = input.status;
  }
  if ("priority" in input) {
    if (!priorities.has(input.priority)) {
      throw Object.assign(new Error("Invalid ticket priority."), { status: 400 });
    }
    output.priority = input.priority;
  }
  if ("resolutionNote" in input) {
    if (typeof input.resolutionNote !== "string" || input.resolutionNote.length > 5000) {
      throw Object.assign(new Error("Resolution note must be 5000 characters or fewer."), { status: 400 });
    }
    output.resolution_note = input.resolutionNote.trim() || null;
  }
  if (!Object.keys(output).length) {
    throw Object.assign(new Error("No supported ticket changes supplied."), { status: 400 });
  }
  return output;
}
