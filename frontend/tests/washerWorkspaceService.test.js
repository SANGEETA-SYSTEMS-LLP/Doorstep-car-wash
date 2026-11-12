import { test } from "node:test";
import assert from "node:assert/strict";
import { isActiveWasherJob, isCompletedWasherJob } from "../src/services/washer/washerJobStatus.js";

test("unvalidated service completion stays active until supervisor review", () => {
  const booking = { status: "service_completed", service_validated_at: null };
  assert.equal(isActiveWasherJob(booking), true);
  assert.equal(isCompletedWasherJob(booking), false);
});

test("validated service completion moves from active to completed jobs", () => {
  const booking = { status: "service_completed", service_validated_at: "2026-11-12T12:00:00.000Z" };
  assert.equal(isActiveWasherJob(booking), false);
  assert.equal(isCompletedWasherJob(booking), true);
});
