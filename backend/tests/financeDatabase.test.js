import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const actor="11111111-1111-4111-8111-111111111111",washer="22222222-2222-4222-8222-222222222222",booking="33333333-3333-4333-8333-333333333333",payment="44444444-4444-4444-8444-444444444444",earning="55555555-5555-4555-8555-555555555555",op="66666666-6666-4666-8666-666666666666",op2="77777777-7777-4777-8777-777777777777";
test("finance SQL executes and protects refund/payout reservations",async t=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);
 create table profiles(id uuid primary key,role text,is_active boolean);
 create table washers(id uuid primary key,is_active boolean,is_verified boolean);
 create table bookings(id uuid primary key,customer_id uuid,assigned_washer_id uuid,payment_method text,status text,total_amount numeric);
 create table payments(id uuid primary key default gen_random_uuid(),booking_id uuid,customer_id uuid,amount numeric,payment_method text,status text,provider text,provider_payment_id text,paid_at timestamptz);
 create table washer_earnings(id uuid primary key,booking_id uuid,washer_id uuid,washer_amount numeric,status text,settled_at timestamptz);
 `);
 await db.exec(await readFile(new URL("../../database-history/supabase-before-cleanup-20261015/migrations/20261013150000_finance_operations.sql",import.meta.url),"utf8"));
 await db.exec(await readFile(new URL("../../database-history/supabase-before-cleanup-20261015/migrations/20261013152000_payment_idempotency.sql",import.meta.url),"utf8"));
 await db.query("insert into auth.users values($1)",[actor]);await db.query("insert into profiles values($1,'accountant',true)",[actor]);
 await db.query("insert into washers values($1,true,true)",[washer]);
 await db.query("insert into bookings values($1,$2,$3,'online','completed',500)",[booking,actor,washer]);
 await db.query("insert into payments(id,booking_id,customer_id,amount,payment_method,status,provider,provider_payment_id) values($1,$2,$3,500,'online','paid','razorpay','pay_test')",[payment,booking,actor]);
 await db.query("insert into washer_earnings values($1,$2,$3,400,'pending',null)",[earning,booking,washer]);
 await db.query("insert into washer_payout_accounts(washer_id,fund_account_id,account_label,updated_by) values($1,'fa_test','Test beneficiary',$2)",[washer,actor]);
 const reserve=(id,kind,target,amount=10000)=>db.query("select reserve_finance_operation($1,$2,$3,$4,'Test reason',$5,'account-test') as op",[id,kind,target,amount,actor]);
 const begin=(cancel=false)=>db.query("select begin_finance_operation($1,$2)",[op,cancel]);
 const reconcile=(status)=>db.query("select reconcile_finance_operation($1,'pout_test',$2)",[op,status]);
 await t.test("payout amount is calculated from eligible earnings and retries reuse one reservation",async()=>{
  const first=await reserve(op,"payout",washer,null);assert.equal(first.rows[0].op.amount_paise,40000);
  const retry=await reserve(op,"payout",washer,null);assert.equal(retry.rows[0].op.id,op);
  assert.equal((await db.query("select count(*)::int n from finance_payout_items")).rows[0].n,1);
  await assert.rejects(reserve(op2,"payout",washer,null),/No eligible/);
  await assert.rejects(reserve(op2,"refund",payment),/payout reservation/);
 });
 await t.test("submitted payouts cannot be cancelled and terminal states resist stale events",async()=>{
  await begin();await assert.rejects(begin(true),/Already submitted/);
  await reconcile("processed");assert.equal((await db.query("select status from washer_earnings")).rows[0].status,"settled");
  await reconcile("pending");assert.equal((await db.query("select status from finance_operations where id=$1",[op])).rows[0].status,"processed");
  await reconcile("reversed");assert.equal((await db.query("select status from washer_earnings")).rows[0].status,"pending");
  assert.equal((await db.query("select count(*)::int n from finance_payout_items")).rows[0].n,0);
  await reconcile("processed");assert.equal((await db.query("select status from washer_earnings")).rows[0].status,"pending");
 });
 await t.test("refund reservations bound the remaining amount and block later payouts",async()=>{
  await reserve(op2,"refund",payment,30000);
  await assert.rejects(reserve("88888888-8888-4888-8888-888888888888","refund",payment,30000),/exceeds/);
  await assert.rejects(reserve("88888888-8888-4888-8888-888888888888","payout",washer,null),/No eligible/);
  await assert.rejects(reserve(op2,"refund",payment,20000),/Idempotency/);
 });
 await t.test("cancelled drafts release reservations but cannot be submitted later",async()=>{
  await db.query("select begin_finance_operation($1,true)",[op2]);
  await assert.rejects(db.query("select begin_finance_operation($1,false)",[op2]),/cancelled/);
  const next=await reserve("88888888-8888-4888-8888-888888888888","refund",payment,50000);assert.equal(next.rows[0].op.amount_paise,50000);
 });
 await t.test("cash recording is idempotent and requires the assigned washer",async()=>{
  await db.query("delete from finance_operations where payment_id=$1",[payment]);await db.query("delete from payments where id=$1",[payment]);await db.query("update bookings set payment_method='cod' where id=$1",[booking]);
  await assert.rejects(db.query("select record_cod_payment_once($1,$2)",[booking,actor]),/assigned/);
  const first=await db.query("select record_cod_payment_once($1,$2) as p",[booking,washer]);
  const second=await db.query("select record_cod_payment_once($1,$2) as p",[booking,washer]);assert.equal(first.rows[0].p.id,second.rows[0].p.id);
  assert.equal((await db.query("select count(*)::int n from payments")).rows[0].n,1);
 });
 }finally{await db.close();}
});
