import { test, mock } from "node:test";
import assert from "node:assert/strict";
mock.module("../src/config/supabase.js",{namedExports:{supabaseAdmin:{}}});
const { validateProviderOperation,executeOperation }=await import("../src/services/financeProvider.js");
const {requireFinanceRole}=await import("../src/controllers/financeController.js");
const {reportRange}=await import("../src/controllers/financeDocumentsController.js");
test("money movement never inherits development role bypass",()=>{let status,next=false;requireFinanceRole({profile:{role:"customer"}},{status(code){status=code;return this;},json(){}},()=>{next=true;});assert.equal(status,403);assert.equal(next,false);requireFinanceRole({profile:{role:"accountant"}},{},()=>{next=true;});assert.equal(next,true);});
test("refund and payout response binding rejects wrong amounts or recipients",()=>{const op={kind:"payout",amount_paise:15000,provider_request:{fund_account_id:"fa_own"}};assert.throws(()=>validateProviderOperation(op,{id:"pout_one",amount:15000,currency:"INR",fund_account_id:"fa_other"}));assert.doesNotThrow(()=>validateProviderOperation(op,{id:"pout_one",amount:15000,currency:"INR",fund_account_id:"fa_own"}));assert.throws(()=>validateProviderOperation({...op,kind:"refund",provider_request:{payment_id:"pay_one"}},{id:"rfnd_one",amount:100,currency:"INR",payment_id:"pay_one"}));});
test("reports validate real dates, bounded ranges and India timezone",()=>{assert.throws(()=>reportRange("2026-02-30","2026-03-01"));assert.throws(()=>reportRange("2026-02-02","2026-02-01"));assert.throws(()=>reportRange("2020-01-01","2026-01-01"));assert.deepEqual(reportRange("2026-10-13","2026-10-13"),{start:"2026-10-12T18:30:00.000Z",end:"2026-10-13T18:30:00.000Z"});});
test("provider retries reuse the exact body and idempotency key; known transfers are fetched",async()=>{
 process.env.RAZORPAYX_KEY_ID="test";process.env.RAZORPAYX_KEY_SECRET="secret";
 const requests=[];const stub=mock.method(globalThis,"fetch",async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({id:"pout_test"})};});
 try{const op={id:"11111111-1111-4111-8111-111111111111",kind:"payout",provider_request:{account_number:"test-account",fund_account_id:"fa_test",amount:1000,currency:"INR"}};await executeOperation(op);await executeOperation(op);assert.equal(requests[0].options.body,requests[1].options.body);assert.equal(requests[0].options.headers["X-Payout-Idempotency"],op.id);await executeOperation({...op,provider_id:"pout_test"});assert.equal(requests[2].options.method,"GET");assert.equal(requests[2].options.body,undefined);}finally{stub.mock.restore();}
});
