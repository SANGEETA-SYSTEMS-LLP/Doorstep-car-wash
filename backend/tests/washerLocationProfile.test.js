import {test,mock} from "node:test";
import assert from "node:assert/strict";
let calls=[],fixtures={};
mock.module("../src/config/supabase.js",{namedExports:{supabaseAdmin:{from(table){
 const call={table,steps:[]};calls.push(call);const q={then:resolve=>Promise.resolve(fixtures[table]||{data:null}).then(resolve)};
 for(const method of ["select","eq","is","in","order","range","maybeSingle","update","upsert"])q[method]=(...args)=>{call.steps.push([method,...args]);return q;};return q;
}}}});
const {validWasherLocation,nearbyWasherCards,saveSignupWasherLocation}=await import("../src/services/washer/washerLocationService.js");
const {saveProfileLocation,getNearbyWashers}=await import("../src/controllers/washer/washerLocationProfileController.js");
const location={latitude:20,longitude:85,address:"123 Main Street, Test City"};
const washer={id:"washer",user_id:"user",is_active:true,is_verified:true,service_radius_km:5,rating:4.5,jobs_completed:20,current_address:"Private home address",location:{latitude:20,longitude:85,updated_at:"2026-10-16T00:00:00Z"}};
test("nearby results filter invalid, unverified and out-of-radius washers without exposing coordinates or addresses",()=>{
 const cards=nearbyWasherCards([washer,{...washer,is_verified:false},{...washer,is_active:false},{...washer,location:null},{...washer,location:{latitude:22,longitude:85}}],20,85);
 assert.equal(cards.length,1);assert.equal(cards[0].distanceKm,0);assert.equal('current_address' in cards[0],false);assert.equal('latitude' in cards[0],false);
 for(const value of [{...location,latitude:null},{...location,longitude:181},{...location,address:"short"}])assert.equal(Boolean(validWasherLocation(value)),false);
 assert.equal(validWasherLocation(location),true);
});
test("signup location is seeded once and never overwrites an edited profile",async()=>{
 calls=[];fixtures={washers:{data:{id:"own",current_address:null}}};
 await saveSignupWasherLocation({id:"user",user_metadata:{washer_signup_location:location}});
 assert.equal(calls[1].steps.find(s=>s[0]==="upsert")[2].ignoreDuplicates,true);
 calls=[];fixtures.washers={data:{id:"own",current_address:"Already saved address"}};
 await saveSignupWasherLocation({id:"user",user_metadata:{washer_signup_location:location}});assert.equal(calls.length,1);
});
test("profile saving uses session ownership and rejects other roles",async()=>{
 async function run(role){let status=200,error;await saveProfileLocation({user:{id:"user"},profile:{role},body:{...location,washer_id:"forged"}},{status(s){status=s;return this;},json(){}},e=>{error=e;});return {status,error};}
 calls=[];fixtures={washers:{data:{id:"own",is_active:true}}};
 assert.equal((await run("customer")).error.status,403);assert.equal(calls.length,0);
 assert.equal((await run("washer")).error,undefined);
 assert.equal(calls[1].steps.find(s=>s[0]==="upsert")[1].washer_id,"own");
 assert.ok(calls[0].steps.some(s=>s[0]==="eq"&&s[1]==="user_id"&&s[2]==="user"));
});
test("customer nearby responses contain public details only",async()=>{
 calls=[];fixtures={washers:{data:[washer]},profiles:{data:[{id:"user",full_name:"Test Washer"}]}};
 let response,error;
 await getNearbyWashers({query:{latitude:"20",longitude:"85"}},{json(data){response=data;}},e=>{error=e;});
 assert.equal(error,undefined);assert.equal(response.washers[0].name,"Test Washer");
 assert.equal('userId' in response.washers[0],false);assert.equal(JSON.stringify(response).includes("Private home"),false);
});
