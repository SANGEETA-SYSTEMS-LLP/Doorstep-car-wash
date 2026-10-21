import { apiRequest } from "./api";

const categoryAliases = {
  hatchback: ["hatchback", "hatch", "compact"],
  sedan: ["sedan"],
  suv: ["suv", "muv", "crossover", "mpv"],
  luxury: ["luxury", "large suv", "premium suv"],
};

function normalizeType(value = "") {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function getVehicleTypeCandidates(vehicleType) {
  const normalized = normalizeType(vehicleType);
  if (!normalized) return [];
  if (normalized.includes("luxury") || normalized.includes("large")) return categoryAliases.luxury;
  if (normalized.includes("hatch")) return categoryAliases.hatchback;
  if (normalized.includes("sedan")) return categoryAliases.sedan;
  if (normalized.includes("suv") || normalized.includes("muv") || normalized.includes("mpv") || normalized.includes("crossover")) return categoryAliases.suv;
  return [normalized];
}

export async function getServicePackages(vehicleType) {
  if (!vehicleType) return [];
  const candidates = getVehicleTypeCandidates(vehicleType);
  const responses = await Promise.all(candidates.map(async type => {
    const query = "?" + new URLSearchParams({ vehicleType: type });
    const result = await apiRequest("/account/packages" + query);
    return result.packages || [];
  }));
  const packages = responses.flat();
  return [...new Map(packages.map(pkg => [pkg.id, pkg])).values()];
}

export async function getOneTimeWashPackages(vehicleId) {
  if (!vehicleId) throw new Error("Select a vehicle before loading wash prices.");
  const result = await apiRequest("/account/packages/one-time-tiers", {
    method: "POST",
    body: JSON.stringify({ vehicleId }),
  });
  return result.packages || [];
}

export async function getMonthlyWashPackages(vehicleId) {
  if (!vehicleId) throw new Error("Select a vehicle before loading monthly plans.");
  const result = await apiRequest("/account/packages/monthly-plans", {
    method: "POST",
    body: JSON.stringify({ vehicleId }),
  });
  return result.packages || [];
}
