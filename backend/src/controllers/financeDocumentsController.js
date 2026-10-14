import { supabaseAdmin as db } from "../config/supabase.js";
const staff = ["accountant", "sub_admin", "super_admin"];
export function reportRange(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) throw Object.assign(new Error("Choose a start and end date."), { status: 400 });
  const start = Date.parse(from + "T00:00:00+05:30"), end = Date.parse(to + "T00:00:00+05:30") + 86400000;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end-start > 366*86400000 || new Date(start+19800000).toISOString().slice(0,10)!==from || new Date(end-86400000+19800000).toISOString().slice(0,10)!==to) throw Object.assign(new Error("Select a valid range of at most 366 days."), { status: 400 });
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}
async function readAll(table, fields, column, range) {
  const rows = [];
  for (let offset=0; ; offset+=1000) {
    const { data, error } = await db.from(table).select(fields).gte(column,range.start).lt(column,range.end).order("id").range(offset,offset+999);
    if (error) throw error;
    rows.push(...data); if (data.length < 1000) return rows;
  }
}
export async function getReport(req,res,next) {
 try {
  const range = reportRange(req.query.from,req.query.to);
  const [payments,operations,bookings] = await Promise.all([
    readAll("payments","id,booking_id,amount,status,payment_method,paid_at","paid_at",range),
    readAll("finance_operations","id,kind,amount_paise,status,created_at,processed_at","processed_at",range),
    readAll("bookings","id,booking_number,status,total_amount,created_at","created_at",range),
  ]);
  const received = payments.filter(p=>p.status==="paid").reduce((sum,p)=>sum+Math.round(Number(p.amount)*100),0);
  const sumKind = kind => operations.filter(p=>p.kind===kind && p.status==="processed").reduce((sum,p)=>sum+Number(p.amount_paise),0);
  res.json({ range, currency:"INR", receivedPaise:received, refundedPaise:sumKind("refund"), paidOutPaise:sumKind("payout"), bookings, payments, operations });
 } catch(error) {next(error);}
}
export async function getInvoice(req,res,next) {
 try {
  const { data: booking, error } = await db.from("bookings").select("id,booking_number,customer_id,service_address,scheduled_date,base_amount,service_amount,platform_fee,discount_amount,tax_amount,extra_charge,total_amount,status").eq("id",req.params.bookingId).maybeSingle();
  if(error) throw error;
  if(!booking) return res.status(404).json({message:"Booking not found."});
  const { data: customer, error: customerError } = await db.from("customers").select("user_id").eq("id",booking.customer_id).single();
  if(customerError) throw customerError;
  if(customer.user_id!==req.user.id && !staff.includes(req.profile?.role)) return res.status(404).json({message:"Booking not found."});
  const { data: existing, error: readError } = await db.from("booking_invoices").select("*").eq("booking_id",booking.id).maybeSingle();
  if(readError) throw readError;
  if(existing) return res.json({invoice:existing});
  if(!["completed","closed","payment_completed","customer_confirmed"].includes(booking.status)) return res.status(409).json({message:"An invoice is available after service completion."});
  if(!process.env.INVOICE_BUSINESS_NAME || !process.env.INVOICE_BUSINESS_ADDRESS) return res.status(503).json({message:"Configure the business name and address before issuing invoices."});
  const {data:profile,error:profileError} = await db.from("profiles").select("full_name").eq("id",customer.user_id).single();
  if(profileError) throw profileError;
  const snapshot={seller:{name:process.env.INVOICE_BUSINESS_NAME,address:process.env.INVOICE_BUSINESS_ADDRESS},customerName:profile.full_name,currency:"INR",booking};
  const {error:insertError} = await db.from("booking_invoices").upsert({booking_id:booking.id,snapshot},{onConflict:"booking_id",ignoreDuplicates:true});
  if(insertError) throw insertError;
  const {data:invoice,error:finalError} = await db.from("booking_invoices").select("*").eq("booking_id",booking.id).single();
  if(finalError) throw finalError;
  res.json({invoice});
 } catch(error) {next(error);}
}
