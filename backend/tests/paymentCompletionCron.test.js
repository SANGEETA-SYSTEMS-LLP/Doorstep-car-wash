import { test, mock } from "node:test";
import assert from "node:assert/strict";

let calls = 0;
mock.module("../src/services/payments/paymentCompletionReconciliationService.js", {
  namedExports: { reconcilePaymentCompletedBookings: async () => { calls++; return 4; } },
});
const { reconcilePaymentCompletions } = await import("../src/controllers/payments/paymentCompletionReconciliationController.js");

async function run(authorization) {
  let status = 200;
  let result;
  await reconcilePaymentCompletions({ headers: { authorization } }, {
    status(code) { status = code; return this; },
    json(data) { result = data; return this; },
  });
  return { status, result };
}

test("payment completion cron requires its bearer secret", async () => {
  const previous = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  try { assert.equal((await run("Bearer wrong")).status, 503); }
  finally { if (previous === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previous; }
});

test("payment completion cron rejects unauthorized callers and runs for the secret", async () => {
  const previous = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-cron-secret";
  calls = 0;
  try {
    assert.equal((await run("Bearer wrong")).status, 401);
    assert.equal(calls, 0);
    const result = await run("Bearer test-cron-secret");
    assert.equal(result.status, 200);
    assert.equal(result.result.reconciled, 4);
    assert.equal(calls, 1);
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
});
