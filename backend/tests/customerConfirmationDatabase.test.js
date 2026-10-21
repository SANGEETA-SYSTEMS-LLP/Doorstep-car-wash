import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('customer confirmation enforces ownership and paid cash progression is idempotent',async()=>{const db=new PGlite();try{
await db.exec(`create role anon;create role authenticated;create role service_role;
create table customers(id uuid,user_id uuid);
create table bookings(id uuid,customer_id uuid,assigned_washer_id uuid,status text,service_validated_at timestamptz,customer_confirmed_at timestamptz,total_amount numeric,payment_method text);
create table payments(id uuid default gen_random_uuid(),booking_id uuid,customer_id uuid,amount numeric,payment_method text,status text,provider text,paid_at timestamptz);
insert into customers values('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
insert into bookings values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','service_completed',null,null,300,'cod');`);
await db.exec(await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/migrations/20261015120000_customer_confirmation_lifecycle.sql',import.meta.url),'utf8'));
const confirm="select confirm_customer_service('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222')";
await assert.rejects(db.query(confirm),/validated/);
await assert.rejects(db.query("select confirm_customer_service('33333333-3333-4333-8333-333333333333',null)"),/not found/);
await db.exec('update bookings set service_validated_at=now()');await db.query(confirm);
assert.equal((await db.query('select status from bookings')).rows[0].status,'customer_confirmed');
const cash="select record_cod_payment_once('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444')";
await db.query(cash);await db.query(cash);await db.query(confirm);
assert.equal((await db.query('select status from bookings')).rows[0].status,'payment_completed');assert.equal((await db.query('select count(*)::int as n from payments')).rows[0].n,1);
}finally{await db.close();}});
