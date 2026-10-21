import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('clean consolidated database installs and matches application contract',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create publication supabase_realtime;
 `);
 const folder=new URL('../../supabase/setup/',import.meta.url);
 for(const file of (await readdir(folder)).filter(f=>f.endsWith('.sql')).sort()) {
  let sql=await readFile(new URL(file,folder),'utf8');
  sql=sql.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/i,'');
  try{await db.exec(sql);}catch(error){throw new Error(file+': '+error.message);}
 }
 await db.exec(await readFile(new URL('../../supabase/verification/verify_installation.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../../supabase/verification/verify_application_contract.sql',import.meta.url),'utf8'));
 const contract=JSON.parse(await readFile(new URL('../../supabase/verification/application_contract.json',import.meta.url),'utf8'));
 const columns=(await db.query("select table_name,column_name from information_schema.columns where table_schema='public'")).rows;
 for(const [table,fields] of Object.entries(contract.tables)){
  assert.ok(columns.some(row=>row.table_name===table),'Missing table '+table);
  for(const field of fields)assert.ok(columns.some(row=>row.table_name===table && row.column_name===field),'Missing column '+table+'.'+field);
 }
 const functions=(await db.query("select routine_name from information_schema.routines where routine_schema='public'")).rows;
 for(const name of contract.rpcs)assert.ok(functions.some(row=>row.routine_name===name),'Missing RPC '+name);
 assert.equal((await db.query("select public from storage.buckets where id='service-photos'")).rows[0].public,false);
 assert.equal((await db.query("select has_function_privilege('authenticated','public.hash_service_otp(text)','EXECUTE') as allowed")).rows[0].allowed,false);
 assert.equal((await db.query('select count(*)::int as n from service_packages')).rows[0].n,9);
 await db.exec(`insert into auth.users(id,email) values ('11111111-1111-4111-8111-111111111111','test@example.test');`);
 assert.equal((await db.query('select count(*)::int as n from customers')).rows[0].n,1);
 await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values
 ('22222222-2222-4222-8222-222222222222','washer@example.test','{"requested_role":"washer"}'),
 ('33333333-3333-4333-8333-333333333333','staff@example.test','{"requested_role":"super_admin"}');`);
 assert.equal((await db.query("select role from profiles where id='22222222-2222-4222-8222-222222222222'")).rows[0].role,'washer');
 assert.deepEqual((await db.query("select status,is_verified from washers where user_id='22222222-2222-4222-8222-222222222222'")).rows[0],{status:'offline',is_verified:false});
 assert.equal((await db.query("select role from profiles where id='33333333-3333-4333-8333-333333333333'")).rows[0].role,'customer');
 const upgrade=await readFile(new URL('../../supabase/migrations/20261016100000_enable_unverified_washer_signup.sql',import.meta.url),'utf8');
 await db.exec(upgrade); await db.exec(upgrade);
 await db.exec("update profiles set role='supervisor' where id='33333333-3333-4333-8333-333333333333'");
 await db.query("select supervisor_add_washer('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222',5)");
 assert.equal((await db.query("select is_verified from washers where user_id='22222222-2222-4222-8222-222222222222'")).rows[0].is_verified,false);
 }finally{await db.close();}
});
