import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PGlite } = require("@electric-sql/pglite");

test("service validation releases completed washers and repairs stale busy state", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      CREATE TABLE washers (id uuid PRIMARY KEY, status text, jobs_completed integer DEFAULT 0, updated_at timestamptz);
      CREATE TABLE bookings (
        id uuid PRIMARY KEY, assigned_washer_id uuid, status text, service_validated_at timestamptz,
        package_id uuid, scheduled_date date, scheduled_start_time time,
        latitude double precision, longitude double precision, service_address text
      );
      CREATE TABLE booking_assignments (booking_id uuid, status text);
      CREATE TABLE service_packages (id uuid, duration_minutes integer);
      CREATE TABLE washer_payout_accounts (
        washer_id uuid, account_label text, destination_encrypted text, fund_account_id text
      );
      CREATE TABLE washer_locations (
        washer_id uuid, latitude double precision, longitude double precision,
        service_latitude double precision, service_longitude double precision, updated_at timestamptz
      );
    `);

    const washerId = "11111111-1111-4111-8111-111111111111";
    const bookingId = "22222222-2222-4222-8222-222222222222";
    await db.query("INSERT INTO washers (id, status, jobs_completed, updated_at) VALUES ($1, 'busy', 0, now())", [washerId]);
    await db.query("INSERT INTO bookings (id, assigned_washer_id, status, service_validated_at) VALUES ($1, $2, 'service_completed', now())", [bookingId, washerId]);
    const migration = await readFile(new URL("../../supabase/migrations/20261112170000_release_washer_after_service_validation.sql", import.meta.url), "utf8");
    await db.exec(migration);
    assert.deepEqual((await db.query("SELECT status, jobs_completed FROM washers WHERE id = $1", [washerId])).rows[0], {
      status: "available",
      jobs_completed: 1,
    });

    const secondWasherId = "33333333-3333-4333-8333-333333333333";
    const secondBookingId = "44444444-4444-4444-8444-444444444444";
    await db.query("INSERT INTO washers (id, status, jobs_completed, updated_at) VALUES ($1, 'busy', 0, now())", [secondWasherId]);
    await db.query("INSERT INTO bookings (id, assigned_washer_id, status) VALUES ($1, $2, 'service_completed')", [secondBookingId, secondWasherId]);
    assert.equal((await db.query("SELECT status FROM washers WHERE id = $1", [secondWasherId])).rows[0].status, "busy");
    await db.query("UPDATE bookings SET service_validated_at = now() WHERE id = $1", [secondBookingId]);
    assert.deepEqual((await db.query("SELECT status, jobs_completed FROM washers WHERE id = $1", [secondWasherId])).rows[0], {
      status: "available",
      jobs_completed: 1,
    });
  } finally {
    await db.close();
  }
});
