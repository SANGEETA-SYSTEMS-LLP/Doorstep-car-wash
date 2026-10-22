import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("washer assignment acceptance requires a verified online washer and confirms one booking atomically", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      CREATE TABLE profiles(id uuid PRIMARY KEY, role text, is_active boolean);
      CREATE TABLE washers(id uuid PRIMARY KEY, user_id uuid, status text, is_active boolean,
        is_verified boolean, service_radius_km numeric, updated_at timestamptz);
      CREATE TABLE washer_payout_accounts(washer_id uuid PRIMARY KEY, account_label text,
        destination_encrypted text, fund_account_id text);
      CREATE TABLE bookings(id uuid PRIMARY KEY, status text, assigned_washer_id uuid,
        package_id uuid, scheduled_date date, scheduled_start_time time,
        latitude double precision, longitude double precision, requires_supervisor boolean,
        updated_at timestamptz);
      CREATE TABLE booking_assignments(id uuid PRIMARY KEY, booking_id uuid, washer_id uuid,
        status text, expires_at timestamptz, responded_at timestamptz, rejection_reason text,
        distance_km numeric, attempt_number integer, offered_at timestamptz);
      CREATE TABLE washer_locations(washer_id uuid, latitude double precision,
        longitude double precision, updated_at timestamptz);
      CREATE TABLE service_packages(id uuid PRIMARY KEY, service_id uuid, duration_minutes integer);
      CREATE TABLE washer_skills(washer_id uuid, service_id uuid);
      CREATE TABLE washer_availability(washer_id uuid, day_of_week integer, start_time time,
        end_time time, is_available boolean);
      CREATE FUNCTION public.booking_washer_is_eligible(uuid, uuid) RETURNS boolean
        LANGUAGE sql AS $$ SELECT false $$;
      CREATE FUNCTION public.accept_booking_assignment(uuid) RETURNS uuid
        LANGUAGE sql AS $$ SELECT $1 $$;
    `);

    const sql = await readFile(new URL("../database/repair_washer_assignment_acceptance.sql", import.meta.url), "utf8");
    await db.exec(sql);
    await db.exec(sql);

    const ids = {
      user: "11111111-1111-4111-8111-111111111111",
      washer: "22222222-2222-4222-8222-222222222222",
      booking: "33333333-3333-4333-8333-333333333333",
      package: "44444444-4444-4444-8444-444444444444",
      service: "55555555-5555-4555-8555-555555555555",
      accepted: "66666666-6666-4666-8666-666666666666",
      other: "77777777-7777-4777-8777-777777777777",
    };
    const query = (id) => `'${id}'`;
    await db.exec(`
      INSERT INTO profiles VALUES (${query(ids.user)}, 'washer', true);
      INSERT INTO washers VALUES (${query(ids.washer)}, ${query(ids.user)}, 'available', true, true, 5, now());
      INSERT INTO washer_payout_accounts VALUES (${query(ids.washer)}, 'Bank account •••• 7890 (HDFC0000001)', 'encrypted-test-value', null);
      INSERT INTO bookings VALUES (${query(ids.booking)}, 'confirmed', null, ${query(ids.package)},
        current_date, '23:30', 17, 78, false, now());
      INSERT INTO booking_assignments VALUES (${query(ids.accepted)}, ${query(ids.booking)}, ${query(ids.washer)},
        'pending', now() + interval '2 minutes', null, null, 0, 1, now());
      INSERT INTO booking_assignments VALUES (${query(ids.other)}, ${query(ids.booking)}, null,
        'pending', now() + interval '2 minutes', null, null, 0, 1, now());
      INSERT INTO washer_locations VALUES (${query(ids.washer)}, 17, 78, now());
      INSERT INTO service_packages VALUES (${query(ids.package)}, ${query(ids.service)}, 60);
      INSERT INTO washer_skills VALUES (${query(ids.washer)}, ${query(ids.service)});
      INSERT INTO washer_availability VALUES (${query(ids.washer)}, extract(dow from current_date)::integer,
        '00:00', '23:59', true);
      SET request.jwt.claim.sub = '${ids.user}';
    `);

    const supervisor = "88888888-8888-4888-8888-888888888888";
    await db.exec(`INSERT INTO profiles VALUES ('${supervisor}', 'supervisor', true);`);
    await assert.rejects(db.query(`SELECT supervisor_assign_washer('${ids.booking}', '${ids.washer}', '${ids.user}')`), /Active supervisor/);
    await assert.rejects(db.query(`SELECT supervisor_assign_washer('${ids.booking}', '${ids.washer}', '${supervisor}')`), /already waiting/);
    await db.exec("UPDATE booking_assignments SET expires_at = now() - interval '1 minute'");
    const offer = await db.query(`SELECT supervisor_assign_washer('${ids.booking}', '${ids.washer}', '${supervisor}') AS result`);
    assert.equal(offer.rows[0].result.status, "pending");
    const awaiting = (await db.query("SELECT * FROM bookings")).rows[0];
    assert.equal(awaiting.assigned_washer_id, null);
    assert.equal(awaiting.status, "finding_washer");
    await db.exec(`UPDATE booking_assignments SET status = 'pending' WHERE id = '${ids.other}'`);

    const accepted = await db.query(`SELECT public.accept_booking_assignment(${query(ids.accepted)}) AS result`);
    assert.equal(accepted.rows[0].result.booking.status, "washer_assigned");
    assert.equal(accepted.rows[0].result.assignment.status, "accepted");
    assert.equal((await db.query("SELECT status FROM washers")).rows[0].status, "busy");
    assert.equal((await db.query(`SELECT status FROM booking_assignments WHERE id = ${query(ids.other)}`)).rows[0].status, "cancelled");

    await db.exec(`UPDATE bookings SET status = 'confirmed', assigned_washer_id = null WHERE id = ${query(ids.booking)};
      UPDATE washers SET status = 'offline' WHERE id = ${query(ids.washer)};
      UPDATE booking_assignments SET status = 'pending', expires_at = now() + interval '2 minutes' WHERE id = ${query(ids.accepted)};`);
    await assert.rejects(db.query(`SELECT public.accept_booking_assignment(${query(ids.accepted)})`), /Go online before accepting/);

    await db.exec(`UPDATE washers SET status = 'available', is_verified = false WHERE id = ${query(ids.washer)};`);
    await assert.rejects(db.query(`SELECT public.accept_booking_assignment(${query(ids.accepted)})`), /Supervisor verification is required/);
    await db.exec(`UPDATE washers SET is_verified = true WHERE id = ${query(ids.washer)}; DELETE FROM washer_payout_accounts WHERE washer_id = ${query(ids.washer)};`);
    assert.equal((await db.query(`SELECT public.booking_washer_is_eligible(${query(ids.booking)}, ${query(ids.washer)}) AS eligible`)).rows[0].eligible, false);
  } finally {
    await db.close();
  }
});
