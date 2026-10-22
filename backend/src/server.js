import dotenv from "dotenv";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

// `npm start` is the production entry point; local development uses dev-server.js.
process.env.NODE_ENV ??= "production";

const { default: app } =
  await import("./app.js");

const { processExpiredAssignments } =
  await import("./services/booking/assignmentTimeoutService.js");

const PORT =
  process.env.PORT || 5000;

const server = createServer({
  requestTimeout: 120_000,
  headersTimeout: 30_000,
  keepAliveTimeout: 5_000,
  maxRequestsPerSocket: 1_000,
}, app);
server.listen(PORT, process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});

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
const { reconcilePendingFinance } = await import("./services/finance/financeReconciliationService.js");
let reconcilingFinance = false;
setInterval(async () => {
  if (reconcilingFinance || process.env.FINANCE_RECONCILIATION_ENABLED !== "true") return;
  reconcilingFinance = true;
  try { await reconcilePendingFinance(); } catch { console.error("Finance reconciliation unavailable; verify migration and credentials."); }
  finally { reconcilingFinance = false; }
}, 60000).unref();
