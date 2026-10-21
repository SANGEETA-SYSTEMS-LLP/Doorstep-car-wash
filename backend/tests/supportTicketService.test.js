import test from "node:test";
import assert from "node:assert/strict";
import { validateTicketInput, validateTicketUpdate } from "../src/services/support/supportTicketService.js";
import { validateCustomerProfileInput } from "../src/services/customer/customerProfileService.js";

test("support ticket validation trims bounded customer input", () => {
  assert.deepEqual(validateTicketInput({
    bookingId: " CW-2026-123 ",
    issueType: "payment_issue",
    subject: " Payment not reflected ",
    description: " The payment was deducted but booking is still pending. ",
  }), {
    booking_id: "CW-2026-123",
    issue_type: "payment_issue",
    subject: "Payment not reflected",
    description: "The payment was deducted but booking is still pending.",
  });
});

test("support ticket validation rejects unknown issue types and short descriptions", () => {
  assert.throws(
    () => validateTicketInput({ issueType: "unknown", subject: "Issue", description: "Long enough description" }),
    { status: 400 },
  );
  assert.throws(
    () => validateTicketInput({ issueType: "other", subject: "Issue", description: "short" }),
    { status: 400 },
  );
});

test("support ticket updates accept only supported statuses and fields", () => {
  assert.deepEqual(validateTicketUpdate({
    status: "resolved",
    priority: "high",
    resolutionNote: "Refund reviewed and customer notified.",
  }), {
    status: "resolved",
    priority: "high",
    resolution_note: "Refund reviewed and customer notified.",
  });

  test("customer profile updates accept only validated name and phone fields", () => {
    assert.deepEqual(validateCustomerProfileInput({
      full_name: "  Asha Sharma ",
      phone: "+91 98765 43210",
    }), {
      full_name: "Asha Sharma",
      phone: "+91 98765 43210",
    });
    assert.throws(() => validateCustomerProfileInput({ full_name: "A", phone: "1234567" }), { status: 400 });
    assert.throws(() => validateCustomerProfileInput({ full_name: "Asha Sharma", phone: "1234567", role: "super_admin" }), { status: 400 });
  });
  assert.throws(() => validateTicketUpdate({ status: "deleted" }), { status: 400 });
  assert.throws(() => validateTicketUpdate({ created_by: "other-user" }), { status: 400 });
});
