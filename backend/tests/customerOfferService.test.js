import test from "node:test";
import assert from "node:assert/strict";
import { calculateOfferDiscount } from "../src/services/customerOfferService.js";

test("FIRSTWASH grants a fixed discount only for a first booking over the minimum", () => {
  assert.deepEqual(calculateOfferDiscount({ code: " firstwash ", servicePrice: 499, firstBooking: true }), { code: "FIRSTWASH", discountAmount: 100 });
  assert.throws(() => calculateOfferDiscount({ code: "FIRSTWASH", servicePrice: 398, firstBooking: true }), /minimum package price/);
  assert.throws(() => calculateOfferDiscount({ code: "FIRSTWASH", servicePrice: 600, firstBooking: false }), /first booking/);
});

test("CLEAN20 applies twenty percent on Premium Wash up to ₹150", () => {
  assert.deepEqual(calculateOfferDiscount({ code: "CLEAN20", servicePrice: 500, packageName: "Premium Wash" }), { code: "CLEAN20", discountAmount: 100 });
  assert.deepEqual(calculateOfferDiscount({ code: "CLEAN20", servicePrice: 1000, packageName: "Premium Wash" }), { code: "CLEAN20", discountAmount: 150 });
  assert.throws(() => calculateOfferDiscount({ code: "CLEAN20", servicePrice: 500, packageName: "Basic Car Wash" }), /Premium Wash/);
});

test("WEEKEND50 validates the chosen service date", () => {
  assert.deepEqual(calculateOfferDiscount({ code: "WEEKEND50", servicePrice: 600, scheduledDate: "2026-10-17" }), { code: "WEEKEND50", discountAmount: 50 });
  assert.throws(() => calculateOfferDiscount({ code: "WEEKEND50", servicePrice: 600, scheduledDate: "2026-10-19" }), /Saturday and Sunday/);
});
