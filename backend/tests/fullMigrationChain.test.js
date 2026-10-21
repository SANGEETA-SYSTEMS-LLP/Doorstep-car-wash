import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('supplied baseline and repository migrations apply in order',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create publication supabase_realtime;
 `);
 for(const directory of ['baseline','migrations']){
  const folder=new URL('../../database-history/supabase-before-cleanup-20261015/'+directory+'/',import.meta.url);
  for(const file of (await readdir(folder)).filter(f=>f.endsWith('.sql')).sort()){
   let sql=await readFile(new URL(file,folder),'utf8');
   // PGlite includes gen_random_uuid but not the Supabase pgcrypto extension.
   if(file==='001_extensions.sql') sql=sql.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/i,'');
   try{await db.exec(sql);}catch(error){throw new Error(directory+'/'+file+': '+error.message,{cause:error});}
  }
 }
 await db.exec(await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/verification/verify_installation.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/verification/verify_application_contract.sql',import.meta.url),'utf8'));
 const contract=JSON.parse(await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/verification/application_contract.json',import.meta.url),'utf8'));
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
 }finally{await db.close();}
});
