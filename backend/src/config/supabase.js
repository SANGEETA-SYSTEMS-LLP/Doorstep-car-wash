import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

function assertConfiguredSecret(name, value) {
  if (process.env.NODE_ENV !== "production" || !value) return;
  if (/^(your[-_]|change[-_]?me|replace[-_]?me|example|placeholder|test[-_]?secret)/i.test(value)) {
    throw new Error(`${name} must be replaced with a production secret.`);
  }
}

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  !supabaseServiceRoleKey
) {
  throw new Error(
    "Missing Supabase backend environment variables."
  );
}

assertConfiguredSecret("SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey);

export const supabaseAuth =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

export const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
