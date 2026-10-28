import { supabaseAdmin as db } from "../../config/supabase.js";
import { processOperation } from "../../controllers/finance/financeController.js";
import { executeOperation, validateProviderOperation } from "./financeProvider.js";
export async function reconcilePendingFinance() {
 const {data,error}=await db.from("finance_operations").select("*").eq("status","pending").not("provider_id","is",null).order("updated_at").limit(50);
 if(error)throw error;
 for(const operation of data){try{await processOperation(operation);}catch{console.error("Finance reconciliation pending for operation",operation.id);}}
 const {data:supervisorOperations,error:supervisorError}=await db.from("supervisor_payout_operations")
  .select("id,supervisor_id,amount_paise,currency,status,provider_id,provider_request")
  .eq("status","pending").not("provider_id","is",null).order("updated_at").limit(50);
 if(supervisorError)throw supervisorError;
 for(const operation of supervisorOperations||[]){
  try{
   const payoutOperation={...operation,kind:"payout"};
   const result=await executeOperation(payoutOperation);
   validateProviderOperation(payoutOperation,result);
   const {error:reconcileError}=await db.rpc("reconcile_supervisor_payout",{p_id:operation.id,p_provider_id:result.id,p_status:result.status});
   if(reconcileError)throw reconcileError;
  }catch{console.error("Supervisor payout reconciliation pending for operation",operation.id);}
 }
}
