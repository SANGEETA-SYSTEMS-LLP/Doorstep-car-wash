import { createClient } from "@supabase/supabase-js";
import { createAuthFetch } from "./authTransport";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env. Restart the Vite dev server after changing environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: createAuthFetch(supabaseUrl, (...args) => fetch(...args), import.meta.env.DEV) },
});
