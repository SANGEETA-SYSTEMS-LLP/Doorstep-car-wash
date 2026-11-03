import {
  supabase,
} from "../services/auth/supabase";

const configuredApiUrl = import.meta.env.VITE_API_URL || "/api";
// The local API binds to IPv4 loopback. On some Windows setups, localhost
// resolves to ::1 first, which produces ERR_CONNECTION_REFUSED despite the API
// being healthy on 127.0.0.1.
const localApiUrl = !import.meta.env.PROD
  ? configuredApiUrl.replace(/^http:\/\/localhost(?=:\d|\/)/i, "http://127.0.0.1")
  : configuredApiUrl;
const API_URL = import.meta.env.PROD ? "/api" : localApiUrl;

let refreshing;
async function refreshAccessToken() {
  refreshing ??= supabase.auth.refreshSession().finally(() => { refreshing = null; });
  const { data, error } = await refreshing;
  if (error) return null;
  return data.session?.access_token || null;
}
async function getAccessToken() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  return (
    session?.access_token ||
    null
  );
}

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    await getAccessToken();

  const isFormData = options.body instanceof FormData;

  let response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        cache: options.cache || "no-store",

        headers: {
          ...(!isFormData
            ? { "Content-Type": "application/json" }
            : {}),

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...options.headers,
        },
      }
    );

  if (response.status === 401 && token) {
    const renewed = await refreshAccessToken();
    if (renewed) response = await fetch(API_URL + endpoint, {
      ...options,
      cache: options.cache || "no-store",
      headers: { ...(!isFormData ? {"Content-Type":"application/json"} : {}), ...options.headers, Authorization: "Bearer " + renewed },
    });
  }
  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw Object.assign(new Error(data?.message || `Request failed (${response.status})`), { status: response.status });
  }

  return data;
}
