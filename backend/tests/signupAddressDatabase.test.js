import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('signup address persists for customer before verification and skips invalid/staff metadata', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create schema auth;
   create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
   create table public.customers(id uuid primary key, user_id uuid references auth.users);
   create table public.customer_addresses(customer_id uuid, label text, address_line text, latitude double precision, longitude double precision, city text, state text, postal_code text, flat_number text, landmark text, is_default boolean);
  `);
  const sql=await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/migrations/20261015150000_customer_signup_address.sql',import.meta.url),'utf8');
  await db.exec(sql); await db.exec(sql);
  const address={address:'123 Test Street, Bhubaneswar',latitude:20.29,longitude:85.82,city:'Bhubaneswar',state:'Odisha',postalCode:'751001',flatNumber:'A-2'};
  const inputs=[{requested_role:'customer',signup_address:address},{requested_role:'washer',signup_address:address},{signup_address:{...address,latitude:'bad'}},{signup_address:{...address,latitude:120}},{signup_address:{...address,postalCode:'bad'}},{}];
  for (let i=0;i<inputs.length;i++) {
   const id='11111111-1111-4111-8111-'+String(i+1).padStart(12,'0');
   await db.query('insert into auth.users values ($1,$2)',[id,JSON.stringify(inputs[i])]);
   await db.query('insert into customers values ($1,$1)',[id]);
  }
  const {rows}=await db.query('select * from customer_addresses');
  assert.equal(rows.length,1); assert.equal(rows[0].address_line,address.address);
  assert.equal(rows[0].flat_number,'A-2'); assert.equal(rows[0].is_default,true);
  assert.equal((await db.query('select count(*)::int as n from customers')).rows[0].n,6);
 } finally {await db.close();}
});
