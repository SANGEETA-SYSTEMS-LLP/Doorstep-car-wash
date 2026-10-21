import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthFetch, loginErrorMessage } from "../src/services/authTransport.js";

test("local proxy preserves login payload and leaves production and database calls unchanged", async () => {
  const calls = [];
  const transport = createAuthFetch("https://example.supabase.co", async (...args) => calls.push(args), true);
  const options = { method: "POST", headers: { apikey: "public-key" }, body: '{"password":"test"}' };
  await transport("https://example.supabase.co/auth/v1/token?grant_type=password", options);
  assert.deepEqual(calls[0], ["/supabase-auth/token?grant_type=password", options]);
  await transport("https://example.supabase.co/rest/v1/profiles", options);
  assert.equal(calls[1][0], "https://example.supabase.co/rest/v1/profiles");
  const direct = createAuthFetch("https://example.supabase.co", async url => url, false);
  assert.equal(await direct("https://example.supabase.co/auth/v1/token"), "https://example.supabase.co/auth/v1/token");
});

test("login distinguishes network errors from rejected credentials", () => {
  assert.match(loginErrorMessage(new TypeError("Failed to fetch")), /Cannot reach/);
  assert.equal(loginErrorMessage({ message: "Invalid login credentials" }), "Invalid login credentials");
});
