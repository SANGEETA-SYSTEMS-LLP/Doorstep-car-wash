import { test, mock } from "node:test";
import assert from "node:assert/strict";
mock.module("../src/config/supabase.js", { namedExports: { supabaseAdmin: {} } });
const { findCoverage } = await import("../src/services/coverageService.js");
const { calculateDistanceKm } = await import("../src/utils/distance.js");
const society = { id: "s1", is_active: true, latitude: 17, longitude: 78, service_radius_km: 1 };
const zone = { id: "z1", is_active: true, society_id: "s1", latitude: 17, longitude: 78, radius_km: 2 };
test("booking coverage accepts any valid location and optionally recognizes a society", () => {
  const result = findCoverage(17, 78, [society], [zone]);
  assert.equal(result.available, true);
  assert.equal(result.society.id, "s1");
  assert.equal(result.zone.id, "z1");
  assert.equal(findCoverage(20, 80, [society], [zone]).available, true);
  assert.equal(findCoverage(17, 78, [society], []).available, true);
  assert.equal(findCoverage(17, 78, [society], [{ ...zone, is_active: false }]).available, true);
  assert.equal(findCoverage(17, 78, [{ ...society, is_active: false }], [zone]).available, true);
});
test("standalone service zones do not invent a society", () => {
  const result = findCoverage(17, 78, [], [{ ...zone, society_id: null }]);
  assert.equal(result.available, true);
  assert.equal(result.society, null);
});
test("invalid coordinates cannot accidentally match a zone", () => {
  for (const point of [[null, 78], ["", 78], [91, 78], [17, 181], ["bad", 78]]) {
    assert.equal(calculateDistanceKm(...point, 17, 78), null);
    assert.equal(findCoverage(...point, [society], [zone]).available, false);
  }
  assert.equal(calculateDistanceKm(0, 0, 0, 0), 0);
});

test("cities across states can book without configured societies or zones", () => {
  for (const [lat,lng] of [[20.2961,85.8245],[28.6139,77.2090],[19.0760,72.8777],[13.0827,80.2707],[22.5726,88.3639]]) {
    const result=findCoverage(lat,lng,[],[]);
    assert.equal(result.available,true);
    assert.equal(result.mode,"all_locations");
    assert.equal(result.zone,null);
    assert.equal(result.society,null);
  }
});
