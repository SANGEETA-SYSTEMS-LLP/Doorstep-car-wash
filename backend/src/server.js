import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const { default: app } =
  await import("./app.js");

const { processExpiredAssignments } =
  await import("./services/assignmentTimeoutService.js");

const PORT =
  process.env.PORT || 5000;

const localTestMode =
  process.env.NODE_ENV === "development" &&
  process.env.TEST_MODE === "true";

app.listen(
  PORT,
  localTestMode ? "127.0.0.1" : "0.0.0.0",
  () => {
    console.log(
      `API running on port ${PORT}`
    );
  }
);

// Development-only scheduler; use a scheduled worker or queue in production.
let processingTimeouts = false;

setInterval(() => {
  if (processingTimeouts) return;
  processingTimeouts = true;

  processExpiredAssignments()
    .catch((error) => {
      console.error("Assignment timeout processor:", error);
    })
    .finally(() => {
      processingTimeouts = false;
    });
}, 60 * 1000);

// Reconcile asynchronous provider outcomes. Never initiates an unsubmitted transfer.
const { reconcilePendingFinance } = await import("./services/financeReconciliationService.js");
let reconcilingFinance = false;
setInterval(async () => {
  if (reconcilingFinance || process.env.FINANCE_RECONCILIATION_ENABLED !== "true") return;
  reconcilingFinance = true;
  try { await reconcilePendingFinance(); } catch { console.error("Finance reconciliation unavailable; verify migration and credentials."); }
  finally { reconcilingFinance = false; }
}, 60000).unref();
