import { supabaseAdmin as db } from "../../config/supabase.js";
import { processOperation } from "../../controllers/finance/financeController.js";
export async function reconcilePendingFinance() {
 const {data,error}=await db.from("finance_operations").select("*").eq("status","pending").not("provider_id","is",null).order("updated_at").limit(50);
 if(error)throw error;
 for(const operation of data){try{await processOperation(operation);}catch{console.error("Finance reconciliation pending for operation",operation.id);}}
}
