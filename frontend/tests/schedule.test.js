import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleDates, canSelectSlot, slotInstant } from "../src/pages/customer/selectschedule/data.js";
test("dates follow India time and roll across years", () => {
 const days=scheduleDates(Date.parse("2026-12-31T20:00:00Z"));
 assert.equal(days[0].iso,"2027-01-01");assert.equal(days.length,30);assert.equal(days[29].iso,"2027-01-30");
});
test("past slots are disabled and future days remain selectable", () => {
 const now=Date.parse("2026-10-14T10:30:00+05:30");
 assert.equal(canSelectSlot("2026-10-14","10:30 AM",now),false);
 assert.equal(canSelectSlot("2026-10-14","11:00 AM",now),true);
 assert.equal(canSelectSlot("2026-10-15","08:00 AM",now),true);
 assert.equal(canSelectSlot("2026-10-13","11:00 AM",now),false);
 assert.equal(canSelectSlot("2026-12-01","11:00 AM",now),false);
 assert.equal(slotInstant("2026-10-14","12:00 PM"),Date.parse("2026-10-14T06:30:00Z"));
});
