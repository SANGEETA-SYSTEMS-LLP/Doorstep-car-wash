import { isPayoutSimulationEnabled, isProviderConfigured } from "../../services/finance/financeProvider.js";

export { listOperations, listWasherPayouts } from "./financeOperationListingController.js";
export { processOperation, createOperation, reconcileOperation } from "./financeOperationActionsController.js";
export function getFinanceProviderStatus(req, res) {
  const simulation = isPayoutSimulationEnabled();
  res.json({ razorpayConfigured: isProviderConfigured(false), razorpayXConfigured: isProviderConfigured(true), razorpayXMode: simulation ? "simulation" : "live" });
}
