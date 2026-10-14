import test from "node:test";
import assert from "node:assert/strict";
import { allowRoles } from "../src/middleware/roleMiddleware.js";

test("local test access is restricted to authenticated development loopback requests", () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, TEST_MODE: process.env.TEST_MODE };
  function check({ env = "development", flag = "true", ip = "127.0.0.1", role = "customer", method = "POST", profile = true } = {}) {
    process.env.NODE_ENV = env;
    process.env.TEST_MODE = flag;
    let result;
    const req = { profile: profile ? { role } : null, method, socket: { remoteAddress: ip } };
    const res = { status(code) { result = code; return this; }, json() { return this; } };
    allowRoles("supervisor")(req, res, () => { result = 200; });
    return result;
  }
  try {
    for (const method of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
      for (const ip of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) assert.equal(check({ method, ip }), 200);
    }
    assert.equal(check({ profile: false }), 401);
    assert.equal(check({ env: "production" }), 403);
    assert.equal(check({ env: "test" }), 403);
    assert.equal(check({ flag: "false" }), 403);
    assert.equal(check({ ip: "192.168.1.2" }), 403);
    assert.equal(check({ ip: undefined, env: "production" }), 403);
    assert.equal(check({ env: "production", role: "supervisor" }), 200);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
