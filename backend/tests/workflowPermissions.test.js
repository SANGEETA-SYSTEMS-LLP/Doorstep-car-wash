import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('workflow grants block browser mutations and long booking numbers stay unique',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon; create role authenticated; create sequence booking_number_seq start 1000000; create table bookings(id uuid,booking_number text); create function find_washer_for_booking(uuid) returns uuid language sql as $$select $1$$;');
 for(const table of ['booking_assignments','booking_status_history','payments','washer_earnings','washer_settlements','extra_charge_requests'])await db.exec('create table '+table+'(id uuid)');
 for(const table of ['bookings','booking_assignments','booking_status_history','payments','washer_earnings','washer_settlements','extra_charge_requests'])await db.exec('grant all on '+table+' to authenticated');
 const sql=await readFile(new URL('../../database-history/supabase-before-cleanup-20261015/migrations/20261015100000_restrict_direct_workflow_writes.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 const numbers=(await db.query('select next_booking_number() as a, next_booking_number() as b')).rows[0];assert.ok(numbers.a.endsWith('-1000000'));assert.ok(numbers.b.endsWith('-1000001'));
 await db.exec('set role authenticated');
 await assert.rejects(db.exec('insert into payments values(null)'),/permission denied/);
 await assert.rejects(db.exec('update washer_settlements set id=null'),/permission denied/);
 await assert.rejects(db.exec('select find_washer_for_booking(null)'),/permission denied/);
 }finally{await db.close();}
});
