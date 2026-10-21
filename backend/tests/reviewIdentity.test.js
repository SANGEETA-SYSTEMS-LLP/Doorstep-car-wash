import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
let calls=[];
const db={from(table){const call={table,steps:[]};calls.push(call);const q={};for(const m of ['select','eq','maybeSingle'])q[m]=(...args)=>{call.steps.push([m,...args]);return q;};q.then=(resolve,reject)=>Promise.resolve({data:table==='customers'?{id:'customer-record'}:null}).then(resolve,reject);return q;}};
mock.module('../src/config/supabase.js',{namedExports:{supabaseAdmin:db}});
const {createReview}=await import('../src/controllers/reviews/reviewController.js');
test('review lookup scopes booking by customer record rather than auth ID',async()=>{
 const res={code:200,status(c){this.code=c;return this;},json(b){this.body=b;return this;}};
 await createReview({user:{id:'auth-user'},params:{bookingId:'booking'},body:{rating:5}},res);
 assert.equal(res.code,404);
 assert.ok(calls[0].steps.some(s=>s[0]==='eq'&&s[1]==='user_id'&&s[2]==='auth-user'));
 assert.ok(calls[1].steps.some(s=>s[0]==='eq'&&s[1]==='customer_id'&&s[2]==='customer-record'));
 assert.ok(calls[1].steps[0][1].includes('assigned_washer_id'));
});
