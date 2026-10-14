import { test,mock } from "node:test";
import assert from "node:assert/strict";
let calls=[],fixtures={},covered=true;
const db={from(table){const call={table,steps:[]};calls.push(call);const q={};for(const method of ["select","eq","single","maybeSingle","insert"])q[method]=(...args)=>{call.steps.push([method,...args]);return q;};q.then=(resolve,reject)=>Promise.resolve(typeof fixtures[table]==="function"?fixtures[table](call):fixtures[table]).then(resolve,reject);return q;}};
mock.module("../src/config/supabase.js",{namedExports:{supabaseAdmin:db}});
mock.module("../src/services/coverageService.js",{namedExports:{getCoverage:async()=>({available:covered})}});
const {createBooking,validateSchedule}=await import("../src/controllers/bookingController.js");
const id="11111111-1111-4111-8111-111111111111";
function reset(){calls=[];covered=true;fixtures={customers:{data:{id:"customer-record"}},bookings:c=>({data:c.steps.some(s=>s[0]==="insert")?{id}:null}),customer_addresses:{data:{address_line:"Test road",latitude:17,longitude:78}},vehicles:{data:{vehicle_type:"sedan"}},service_packages:{data:{vehicle_type:"sedan",price:600}}};}
async function run(paymentMethod="cod"){let result,status=200,error;await createBooking({user:{id:"auth-user"},body:{requestId:id,addressId:id,vehicleId:id,packageId:id,date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:"12:00",paymentMethod,total_amount:1}}, {status(code){status=code;return this;},json(value){result=value;}},err=>{error=err;});return {result,status,error};}
test("booking uses trusted package price and scopes address/vehicle ownership",async()=>{reset();const r=await run();assert.equal(r.status,201);const payload=calls.find(c=>c.steps.some(s=>s[0]==="insert")).steps.find(s=>s[0]==="insert")[1];assert.equal(payload.total_amount,600);assert.equal(payload.customer_id,"customer-record");for(const table of ["customer_addresses","vehicles"])assert.ok(calls.find(c=>c.table===table).steps.some(s=>s[0]==="eq"&&s[1]==="customer_id"&&s[2]==="customer-record"));});
test("uncovered or mismatched vehicles cannot create bookings",async()=>{reset();covered=false;assert.equal((await run()).error.status,400);assert.ok(!calls.some(c=>c.steps.some(s=>s[0]==="insert")));reset();fixtures.vehicles={data:{vehicle_type:"suv"}};assert.equal((await run()).error.status,400);});
test("invalid calendar dates and past service times are rejected",()=>{const now=Date.parse("2026-02-01T00:00:00Z");assert.throws(()=>validateSchedule("2026-02-30","12:00",now));assert.throws(()=>validateSchedule("2026-01-31","12:00",now));assert.throws(()=>validateSchedule("2026-02-02","25:00",now));assert.doesNotThrow(()=>validateSchedule("2026-02-02","12:00",now));});

test("all displayed payment methods are accepted and preserved",async()=>{
 for(const method of ["upi","card","netbanking","wallet","cod"]){
  reset();const result=await run(method);assert.equal(result.error,undefined);assert.equal(result.status,201);
  const payload=calls.find(c=>c.steps.some(s=>s[0]==="insert")).steps.find(s=>s[0]==="insert")[1];
  assert.equal(payload.payment_method,method);
 }
});
test("unknown payment methods return a payment-specific error before database access",async()=>{
 reset();const result=await run("invalid");assert.equal(result.error.status,400);assert.equal(result.error.message,"Choose a supported payment method.");assert.equal(calls.length,0);
});
