import { test, mock } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
let fixtures={},calls=[],captured={},orders=0,earnings=0;
const db={from(table){const call={table,steps:[]};calls.push(call);const q={};for(const method of ["select","eq","in","maybeSingle","single","insert","update"])q[method]=(...args)=>{call.steps.push([method,...args]);return q;};q.then=(resolve,reject)=>Promise.resolve(typeof fixtures[table]==="function"?fixtures[table](call):fixtures[table]||{data:null}).then(resolve,reject);return q;},rpc:async()=>({data:{id:"cash-payment"}})};
mock.module("../src/config/supabase.js",{namedExports:{supabaseAdmin:db}});
mock.module("../src/config/razorpay.js",{namedExports:{razorpay:{payments:{fetch:async()=>captured},orders:{create:async()=>{orders++;return {id:"order_new",amount:50000,currency:"INR"};}}}}});
mock.module("../src/services/earningService.js",{namedExports:{createWasherEarning:async()=>{earnings++;}}});
const {createPaymentOrder,verifyPayment,razorpayWebhook}=await import("../src/controllers/paymentController.js");
process.env.RAZORPAY_KEY_SECRET="test-secret";process.env.RAZORPAY_WEBHOOK_SECRET="webhook-secret";
function reset(){calls=[];orders=0;earnings=0;fixtures={customers:{data:{id:"customer-record"}},bookings:{data:{id:"booking",customer_id:"customer-record",status:"pending",payment_method:"upi",total_amount:500,booking_number:"CW-TEST"}},payments:{data:null}};captured={id:"pay_test",order_id:"order_test",amount:50000,currency:"INR",status:"captured"};}
async function run(handler,extra={}){let status=200,result;await handler({user:{id:"user"},params:{bookingId:"booking"},body:{},...extra},{status(code){status=code;return this;},json(data){result=data;return this;},send(data){result=data;return this;}});return {status,result};}
const signature=()=>crypto.createHmac("sha256","test-secret").update("order_test|pay_test").digest("hex");
test("payment order amount comes from database and reuses an existing order",async()=>{reset();fixtures.payments={data:{id:"payment",status:"created",amount:500,provider_order_id:"order_test"}};const r=await run(createPaymentOrder,{body:{amount:1}});assert.equal(r.result.amount,50000);assert.equal(r.result.orderId,"order_test");assert.equal(orders,0);});
test("paid bookings cannot create another checkout order",async()=>{reset();fixtures.payments={data:{status:"paid"}};assert.equal((await run(createPaymentOrder)).status,409);assert.equal(orders,0);});
test("a valid signature still requires captured matching currency, amount and order",async()=>{for(const patch of [{status:"authorized"},{amount:1},{currency:"USD"},{order_id:"order_other"}]){reset();fixtures.payments={data:{id:"payment",amount:500,customer_id:"customer-record",provider_order_id:"order_test",booking_id:"booking"}};captured={...captured,...patch};const r=await run(verifyPayment,{body:{razorpay_order_id:"order_test",razorpay_payment_id:"pay_test",razorpay_signature:signature()}});assert.equal(r.status,400);assert.equal(earnings,0);assert.ok(!calls.some(c=>c.steps.some(s=>s[0]==="update")));}});
test("captured checkout updates payment and triggers completion-aware earnings",async()=>{reset();fixtures.payments=call=>call.steps.some(s=>s[0]==="update")?{data:null}:{data:{id:"payment",amount:500,customer_id:"customer-record",provider_order_id:"order_test",booking_id:"booking"}};const r=await run(verifyPayment,{body:{razorpay_order_id:"order_test",razorpay_payment_id:"pay_test",razorpay_signature:signature()}});assert.equal(r.status,200);assert.equal(earnings,1);});
test("verification rejects another customer before fetching or changing payment",async()=>{reset();fixtures.payments={data:{customer_id:"other-customer"}};assert.equal((await run(verifyPayment,{body:{razorpay_order_id:"order_test",razorpay_payment_id:"pay_test",razorpay_signature:signature()}})).status,403);assert.equal(earnings,0);});
test("webhook rejects tampered signatures without database writes",async()=>{reset();const r=await run(razorpayWebhook,{headers:{"x-razorpay-signature":"invalid"},body:Buffer.from('{}')});assert.equal(r.status,400);assert.equal(calls.length,0);});

test("pay-after-service bookings can use Razorpay only after customer confirmation",async()=>{
 reset();fixtures.bookings.data.payment_method="cod";
 assert.equal((await run(createPaymentOrder)).status,400);assert.equal(orders,0);
 fixtures.bookings.data.status="customer_confirmed";
 fixtures.payments={data:{id:"payment",status:"created",amount:500,provider_order_id:"order_test"}};
 const result=await run(createPaymentOrder);assert.equal(result.status,200);assert.equal(result.result.orderId,"order_test");
 reset();fixtures.bookings.data.payment_method="cod";fixtures.bookings.data.status="closed";
 fixtures.payments={data:{id:"payment",status:"created",amount:500,provider_order_id:"order_test"}};
 assert.equal((await run(createPaymentOrder)).status,200);
 fixtures.payments={data:{status:"paid"}};
 assert.equal((await run(createPaymentOrder)).status,409);
});
