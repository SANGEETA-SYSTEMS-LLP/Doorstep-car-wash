import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("profile security migration prevents self-promotion and recursive reads", async () => {
 const db = new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select '11111111-1111-4111-8111-111111111111'::uuid $$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 create table profiles(id uuid primary key, role text, is_active boolean, full_name text);
 create table customers(id uuid, total_spent numeric);
 create table washers(id uuid, is_verified boolean);
 insert into profiles values ('11111111-1111-4111-8111-111111111111','customer',true,'Test');
 grant select,insert,update,delete on profiles,customers,washers to authenticated;
 grant update(role) on profiles to authenticated;
 alter table profiles enable row level security;
 create policy profiles_select_own on profiles for select to authenticated using(id=auth.uid());
 create policy profiles_update_own on profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
 create policy admins_select_profiles on profiles for select to authenticated using(exists(select 1 from profiles p where p.id=auth.uid() and p.role='super_admin'));
 `);
 const sql = await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/migrations/20261015090000_harden_client_profile_updates.sql', import.meta.url),'utf8');
 await db.exec(sql); await db.exec(sql);
 // Simulate a legacy policy replay after hardening.
 await db.exec("create policy stale_recursive_profiles on profiles for select to authenticated using(exists(select 1 from profiles p where p.id=auth.uid()))");
 await db.exec('set role authenticated');
 await assert.rejects(db.query('select * from profiles'), error => error.code === '42P17');
 await db.exec('reset role');
 await db.exec("insert into profiles values ('22222222-2222-4222-8222-222222222222','customer',true,'Other customer')");
 const repair=await readFile(new URL('../../supabase/migrations/20261016090000_repair_recursive_profile_policies.sql',import.meta.url),'utf8');
 await db.exec(repair); await db.exec(repair);
 await db.exec('set role authenticated');
 assert.equal((await db.query('select * from profiles')).rows.length,1);
 await assert.rejects(db.exec("update profiles set role='super_admin'"), /permission denied/);
 await assert.rejects(db.exec('update washers set is_verified=true'), /permission denied/);
 await assert.rejects(db.exec('update customers set total_spent=0'), /permission denied/);
 await db.exec('reset role');
 await db.exec("update profiles set role='support'");
 await db.exec('set role authenticated');
 assert.equal((await db.query('select * from profiles')).rows.length,2);
 await db.exec('reset role');
 await db.exec('update profiles set is_active=false');
 assert.equal((await db.query('select current_profile_role() as role')).rows[0].role,null);
 await db.exec('set role authenticated');
 assert.equal((await db.query('select * from profiles')).rows.length,1);
 } finally { await db.close(); }
});
