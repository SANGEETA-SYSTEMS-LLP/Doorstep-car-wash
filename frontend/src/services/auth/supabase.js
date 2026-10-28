import { createClient } from "@supabase/supabase-js";
import { createAuthFetch } from "./authTransport";

const AUTH_RATE_LIMIT_KEY = "washnow-auth-rate-v1";
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 20;

function limitDirectAuthRequests(url, options) {
  if (typeof window === "undefined" || !["POST", "PUT"].includes(String(options.method || "GET").toUpperCase())) return;
  const path = new URL(url).pathname;
  if (!/\/(token|recover|signup|resend|verify|user)(?:\/|$)/.test(path)) return;
  let state = { start: Date.now(), count: 0 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(AUTH_RATE_LIMIT_KEY) || "null");
    if (saved && Number.isFinite(saved.start) && Number.isFinite(saved.count) && Date.now() - saved.start < AUTH_WINDOW_MS) state = saved;
  } catch {}
  if (Date.now() - state.start >= AUTH_WINDOW_MS) state = { start: Date.now(), count: 0 };
  if (state.count >= AUTH_MAX_ATTEMPTS) throw Object.assign(new Error("Too many sign-in or password-reset attempts. Please wait 15 minutes and try again."), { name: "AuthRateLimitError" });
  state.count += 1;
  try { window.localStorage.setItem(AUTH_RATE_LIMIT_KEY, JSON.stringify(state)); } catch {}
}

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
  global: { fetch: createAuthFetch(supabaseUrl, (...args) => fetch(...args), import.meta.env.DEV, limitDirectAuthRequests) },
});
