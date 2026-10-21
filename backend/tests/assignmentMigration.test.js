import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('assignment migration replaces legacy signatures and denies nonexistent supervisors', async()=>{
 const db=new PGlite(); try {
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
 create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
 create table profiles(id uuid,role text,is_active boolean);
 create table washers(id uuid,user_id uuid,status text,is_active boolean,is_verified boolean,service_radius_km numeric);
 create table bookings(id uuid, status text, assigned_washer_id uuid,package_id uuid,scheduled_date date,scheduled_start_time time,latitude double precision,longitude double precision,requires_supervisor boolean,updated_at timestamptz);
 create table booking_assignments(id uuid, booking_id uuid,washer_id uuid,status text,expires_at timestamptz,responded_at timestamptz,rejection_reason text,distance_km numeric,attempt_number integer,offered_at timestamptz);
 create table washer_locations(washer_id uuid,latitude double precision,longitude double precision,updated_at timestamptz);
 create table service_packages(id uuid,service_id uuid,duration_minutes integer);
 create table washer_availability(washer_id uuid,day_of_week integer,start_time time,end_time time,is_available boolean);
 create table washer_skills(washer_id uuid,service_id uuid);
 create function accept_booking_assignment(uuid) returns uuid language sql as $$select $1$$;
 `);
 const sql=await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/migrations/20261015110000_refresh_assignment_contract.sql',import.meta.url),'utf8');
 await db.exec(sql); await db.exec(sql);
 assert.equal((await db.query("select pg_get_function_result('public.accept_booking_assignment(uuid)'::regprocedure) as result")).rows[0].result,'jsonb');
 await assert.rejects(db.query('select supervisor_assign_washer(null,null,null)'),/Supervisor permission required/);
 await assert.rejects(db.query('select accept_booking_assignment(null)'),/Authentication required/);
 assert.equal((await db.query("select has_function_privilege('authenticated','public.supervisor_assign_washer(uuid,uuid,uuid)','EXECUTE') as allowed")).rows[0].allowed,false);
 await db.exec(`insert into profiles values ('11111111-1111-4111-8111-111111111111','supervisor',true);
 insert into washers values ('22222222-2222-4222-8222-222222222222',null,'available',true,true,5);
 insert into bookings values ('33333333-3333-4333-8333-333333333333','confirmed',null,'44444444-4444-4444-8444-444444444444','2026-10-15','10:00',17,78,false,now());
 insert into service_packages values ('44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555',60);
 insert into washer_skills values ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555');
 insert into washer_locations values ('22222222-2222-4222-8222-222222222222',17,78,now());
 insert into washer_availability values ('22222222-2222-4222-8222-222222222222',4,'09:00','17:00',true);
 insert into booking_assignments values ('66666666-6666-4666-8666-666666666666','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','pending',now()+interval '2 minutes',null,null,0,1,now());
 insert into booking_assignments values ('77777777-7777-4777-8777-777777777777','33333333-3333-4333-8333-333333333333',null,'pending',now()+interval '2 minutes',null,null,0,1,now());`);
 await db.query("select supervisor_assign_washer('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111')");
 assert.equal((await db.query('select status from washers')).rows[0].status,'busy');
 assert.equal((await db.query("select status from booking_assignments where id='77777777-7777-4777-8777-777777777777'")).rows[0].status,'cancelled');
 await assert.rejects(db.query("select supervisor_assign_washer('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111')"),/no longer eligible/);
 }finally{await db.close();}
});
